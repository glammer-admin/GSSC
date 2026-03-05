import { NextRequest, NextResponse } from "next/server"
import { 
  getSession, 
  refreshSession, 
  isSessionExpiringSoon, 
  SESSION_COOKIE_NAME,
  isTemporarySession,
  isCompleteSession,
  type AnySessionData,
  type SessionRole,
} from "@/lib/auth/session-manager"

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
  selectRole: "/select-role",
}

// Rutas de API para sesiones temporales
const TEMPORARY_API_ROUTES = [
  "/api/auth/set-role",
  "/api/users/register",
]

// Rutas por rol (sesión completa)
const ROLE_ROUTES: Record<SessionRole, string[]> = {
  organizer: ["/dashboard", "/settings", "/project", "/api/settings", "/api/project", "/api/product"],
  supplier: ["/customer-dash"],
  buyer: ["/product"],
}

/**
 * Obtiene la ruta por defecto para un rol
 */
function getDefaultRouteForRole(role: SessionRole): string {
  const routes: Record<SessionRole, string> = {
    organizer: "/dashboard",
    supplier: "/customer-dash",
    buyer: "/product/1234asdf",
  }
  return routes[role]
}

/**
 * Verifica si un rol tiene acceso a una ruta específica
 */
function checkRoleAccess(role: SessionRole, pathname: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role]
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
  if (session.needsRoleSelection) {
    return TEMPORARY_SESSION_ROUTES.selectRole
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
          // Sesión temporal → redirigir a onboarding o select-role
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

    // 6. Manejar rutas de sesión temporal (/onboarding, /select-role)
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

    if (pathname === TEMPORARY_SESSION_ROUTES.selectRole) {
      if (!session) {
        // Sin sesión → redirigir a login
        console.log("🔐 [MIDDLEWARE] Sin sesión en /select-role, redirigiendo a login")
        return NextResponse.redirect(new URL("/", request.url))
      }
      
      if (isCompleteSession(session)) {
        // Sesión completa → redirigir a dashboard
        console.log("🔄 [MIDDLEWARE] Sesión completa en /select-role, redirigiendo a dashboard")
        return NextResponse.redirect(new URL(getDefaultRouteForRole(session.role), request.url))
      }
      
      if (!session.needsRoleSelection) {
        // No necesita selección de rol → redirigir según estado
        const redirect = getTemporarySessionRedirect(session)
        if (redirect && redirect !== pathname) {
          console.log(`🔄 [MIDDLEWARE] No necesita role selection, redirigiendo a ${redirect}`)
          return NextResponse.redirect(new URL(redirect, request.url))
        }
        // Si no hay redirect válido, ir a login
        return NextResponse.redirect(new URL("/", request.url))
      }
      
      // Permitir acceso a select-role
      console.log("✅ [MIDDLEWARE] Permitiendo acceso a /select-role")
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

    // 11. Refrescar sesión si está próxima a expirar
    if (isSessionExpiringSoon(session)) {
      await refreshSession()
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)

    // En caso de error, eliminar cookie y redirigir
    const response = NextResponse.redirect(new URL("/", request.url))
    response.cookies.delete(SESSION_COOKIE_NAME)
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
