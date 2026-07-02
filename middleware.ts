import { NextRequest, NextResponse } from "next/server"
import {
  getSession,
  refreshSession,
  isSessionExpiringSoon,
  isSupabaseTokenExpiringSoon,
  SESSION_COOKIE_NAME,
  isTemporarySession,
  isCompleteSession,
  type AnySessionData,
  type SessionRole,
} from "@/lib/auth/session-manager"
import { getConfig } from "@/lib/config/env"

// Rutas que NO requieren autenticación (pero pueden redirigir si ya hay sesión)
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/callback",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/google/callback",
  "/api/auth/google/token",
  "/api/auth/microsoft/callback",
  "/api/auth/microsoft/token",
]

// Rutas de API que requieren autenticación
const PROTECTED_API_ROUTES = ["/api/protected"]

// Rutas para sesiones temporales
const TEMPORARY_SESSION_ROUTES = {
  onboarding: "/onboarding",
}

// Rutas de API para sesiones temporales
const TEMPORARY_API_ROUTES = [
  "/api/users/register",
]

// Rutas por rol (sesión completa). GSSC es exclusiva de organizadores; cualquier otra
// sesión (buyer/supplier legacy) no tiene acceso a ninguna ruta.
const ROLE_ROUTES: Partial<Record<SessionRole, string[]>> = {
  organizer: ["/dashboard", "/settings", "/project", "/api/settings", "/api/project", "/api/product"],
}

/**
 * Obtiene la ruta por defecto para el rol organizer (único rol de GSSC).
 */
function getDefaultRouteForRole(role: SessionRole): string {
  const routes: Partial<Record<SessionRole, string>> = {
    organizer: "/dashboard",
  }
  return routes[role] ?? "/"
}

/**
 * Verifica si un rol tiene acceso a una ruta específica
 */
function checkRoleAccess(role: SessionRole, pathname: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role]
  if (!allowedRoutes) return false
  return allowedRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Obtiene la ruta de redirección para una sesión temporal
 */
function getTemporarySessionRedirect(session: AnySessionData): string | null {
  if (!isTemporarySession(session)) return null
  
  if (session.needsOnboarding) {
    return TEMPORARY_SESSION_ROUTES.onboarding
  }
  return null
}

/**
 * Middleware de autenticación y autorización
 * Se ejecuta en TODAS las peticiones SSR
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Permitir acceso a rutas públicas de API
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next()
  }

  // 2. Permitir acceso a archivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  try {
    // 3. Obtener y validar la sesión
    const session = await getSession()

    // 3b. GSSC es exclusiva de organizadores. La cookie de sesión se comparte en
    //     .glam-urban.dev con otras apps (gssc-management / backoffice), así que puede
    //     llegar una sesión COMPLETA con un rol que GSSC no atiende (admin/supplier, o
    //     buyer legacy). No la servimos aquí: la enviamos a su portal externo SIN borrar
    //     la cookie compartida (otras apps la verifican con el mismo SESSION_SECRET).
    //     Sin esta guarda, getDefaultRouteForRole devuelve "/" para roles no-organizer y
    //     el handler de "/" vuelve a redirigir a "/" → bucle ERR_TOO_MANY_REDIRECTS.
    if (session && isCompleteSession(session) && session.role !== "organizer") {
      const mgmtUrl = process.env.MANAGEMENT_URL
      if (mgmtUrl && mgmtUrl.length > 0) {
        console.log("🔄 [MIDDLEWARE] Sesión no-organizer detectada, redirigiendo a portal externo")
        return NextResponse.redirect(mgmtUrl)
      }
      // Sin URL externa configurada: evitar el bucle mostrando el login.
      if (pathname !== "/") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      return NextResponse.next()
    }

    // 4. CASO ESPECIAL: Página de login (/)
    if (pathname === "/") {
      if (session) {
        // Usuario autenticado intentando acceder a login
        if (isCompleteSession(session)) {
          // Sesión completa → redirigir a dashboard
          console.log("🔄 [MIDDLEWARE] Usuario con sesión completa accediendo a /, redirigiendo a dashboard...")
          const defaultRoute = getDefaultRouteForRole(session.role)
          return NextResponse.redirect(new URL(defaultRoute, request.url))
        } else {
          // Sesión temporal → redirigir a onboarding
          const redirect = getTemporarySessionRedirect(session)
          if (redirect) {
            console.log(`🔄 [MIDDLEWARE] Usuario con sesión temporal accediendo a /, redirigiendo a ${redirect}...`)
            return NextResponse.redirect(new URL(redirect, request.url))
          }
        }
      }
      // Usuario sin sesión → permitir acceso al login
      console.log("✅ [MIDDLEWARE] Usuario sin sesión accediendo a /, permitiendo acceso a login")
      return NextResponse.next()
    }

    // 5. Permitir acceso a rutas de API para sesiones temporales
    if (TEMPORARY_API_ROUTES.some(route => pathname.startsWith(route))) {
      if (session && isTemporarySession(session)) {
        console.log(`✅ [MIDDLEWARE] Permitiendo acceso a API temporal: ${pathname}`)
        return NextResponse.next()
      }
      // Si no hay sesión temporal, rechazar
      return NextResponse.json(
        { error: "Unauthorized", message: "Temporary session required" },
        { status: 401 }
      )
    }

    // 6. Manejar rutas de sesión temporal (/onboarding)
    if (pathname === TEMPORARY_SESSION_ROUTES.onboarding) {
      if (!session) {
        // Sin sesión → redirigir a login
        console.log("🔐 [MIDDLEWARE] Sin sesión en /onboarding, redirigiendo a login")
        return NextResponse.redirect(new URL("/", request.url))
      }
      
      if (isCompleteSession(session)) {
        // Sesión completa → redirigir a dashboard
        console.log("🔄 [MIDDLEWARE] Sesión completa en /onboarding, redirigiendo a dashboard")
        return NextResponse.redirect(new URL(getDefaultRouteForRole(session.role), request.url))
      }
      
      if (!session.needsOnboarding) {
        // No necesita onboarding → redirigir según estado
        const redirect = getTemporarySessionRedirect(session)
        if (redirect && redirect !== pathname) {
          console.log(`🔄 [MIDDLEWARE] No necesita onboarding, redirigiendo a ${redirect}`)
          return NextResponse.redirect(new URL(redirect, request.url))
        }
        // Si no hay redirect válido, ir a login
        return NextResponse.redirect(new URL("/", request.url))
      }
      
      // Permitir acceso a onboarding
      console.log("✅ [MIDDLEWARE] Permitiendo acceso a /onboarding")
      return NextResponse.next()
    }

    // 7. Si no hay sesión válida, redirigir al login
    if (!session) {
      // Para API routes, retornar 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized", message: "No valid session" },
          { status: 401 }
        )
      }

      // Para páginas protegidas, redirigir al login
      console.log(`🔐 [MIDDLEWARE] Sin sesión, redirigiendo desde ${pathname} a /`)
      const loginUrl = new URL("/", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 8. Si es sesión temporal intentando acceder a rutas protegidas
    if (isTemporarySession(session)) {
      const redirect = getTemporarySessionRedirect(session)
      if (redirect) {
        console.log(`🔄 [MIDDLEWARE] Sesión temporal accediendo a ${pathname}, redirigiendo a ${redirect}`)
        return NextResponse.redirect(new URL(redirect, request.url))
      }
      // Si no hay redirect válido, ir a login
      return NextResponse.redirect(new URL("/", request.url))
    }

    // 9. Verificar autorización basada en roles (solo para sesiones completas)
    const hasAccess = checkRoleAccess(session.role, pathname)
    if (!hasAccess) {
      console.log(`⚠️ [MIDDLEWARE] Usuario ${session.role} sin acceso a ${pathname}, redirigiendo...`)
      // Redirigir a la ruta por defecto del rol
      const defaultRoute = getDefaultRouteForRole(session.role)
      return NextResponse.redirect(new URL(defaultRoute, request.url))
    }

    // 10. Crear respuesta y agregar headers con info del usuario
    const response = NextResponse.next()

    // Agregar información del usuario en headers personalizados
    // Estos headers están disponibles en getServerSideProps y API routes
    response.headers.set("X-User-Sub", session.sub)
    response.headers.set("X-User-Email", session.email)
    response.headers.set("X-User-Role", session.role)
    response.headers.set("X-User-Provider", session.provider)
    if (session.userId) {
      response.headers.set("X-User-Id", session.userId)
    }
    if (session.authId) {
      response.headers.set("X-Auth-Id", session.authId)
    }

    // 11. Refrescar sesión BFF si está próxima a expirar,
    //     y/o renovar el Supabase token si está por expirar.
    //     Persistimos el token actualizado en response.cookies (no cookies().set())
    //     porque el middleware no puede usar cookies() para escritura.
    if (isCompleteSession(session)) {
      const needsSessionRefresh = isSessionExpiringSoon(session)
      const needsSupabaseRefresh = isSupabaseTokenExpiringSoon(session.supabaseAccessToken)

      if (needsSessionRefresh || needsSupabaseRefresh) {
        let supabaseAccessToken = session.supabaseAccessToken
        let supabaseRefreshToken = session.supabaseRefreshToken

        // Renovar Supabase token si es necesario
        if (needsSupabaseRefresh && session.supabaseRefreshToken) {
          const { refreshSupabaseToken } = await import("@/lib/auth/supabase-admin")
          const renewed = await refreshSupabaseToken(session.supabaseRefreshToken)
          supabaseAccessToken = renewed.accessToken
          supabaseRefreshToken = renewed.refreshToken
          console.log("✅ [MIDDLEWARE] Supabase token renewed")
        }

        // Crear nuevo JWT de sesión con tokens actualizados
        const { createSessionToken } = await import("@/lib/auth/session-manager")
        const newToken = await createSessionToken({
          sub: session.sub,
          email: session.email,
          name: session.name,
          picture: session.picture,
          provider: session.provider,
          role: session.role,
          userId: session.userId,
          supabaseAccessToken,
          supabaseRefreshToken,
          authId: session.authId,
        })

        const config = getConfig()
        response.cookies.set(SESSION_COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: config.secureCookies,
          sameSite: "lax",
          maxAge: config.sessionDuration,
          path: "/",
          domain: config.cookieDomain,
        })
        console.log("✅ [MIDDLEWARE] Session cookie refreshed")
      }
    } else if (isSessionExpiringSoon(session)) {
      // Sesión temporal próxima a expirar — solo extender duración
      await refreshSession()
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)

    // En caso de error, eliminar cookie y redirigir
    const config = getConfig()
    const response = NextResponse.redirect(new URL("/", request.url))
    response.cookies.delete(SESSION_COOKIE_NAME)
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      domain: config.cookieDomain,
    })
    return response
  }
}

/**
 * Configuración del matcher
 * Define en qué rutas se ejecuta el middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
}
