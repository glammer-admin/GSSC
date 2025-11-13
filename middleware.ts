import { NextRequest, NextResponse } from "next/server"
import { getSession, refreshSession, isSessionExpiringSoon, SESSION_COOKIE_NAME } from "@/lib/auth/session-manager"

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

// Rutas por rol
const ROLE_ROUTES = {
  Organizador: ["/dashboard"],
  Proveedor: ["/customer-dash"],
  Pagador: ["/product"],
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
        // Usuario autenticado intentando acceder a login → redirigir a dashboard
        console.log("🔄 [MIDDLEWARE] Usuario autenticado accediendo a /, redirigiendo a dashboard...")
        const defaultRoute = getDefaultRouteForRole(session.role)
        return NextResponse.redirect(new URL(defaultRoute, request.url))
      } else {
        // Usuario sin sesión → permitir acceso al login
        console.log("✅ [MIDDLEWARE] Usuario sin sesión accediendo a /, permitiendo acceso a login")
        return NextResponse.next()
      }
    }

    // 5. Si no hay sesión válida, redirigir al login
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

    // 6. Verificar autorización basada en roles
    const hasAccess = checkRoleAccess(session.role, pathname)
    if (!hasAccess) {
      console.log(`⚠️ [MIDDLEWARE] Usuario ${session.role} sin acceso a ${pathname}, redirigiendo...`)
      // Redirigir a la ruta por defecto del rol
      const defaultRoute = getDefaultRouteForRole(session.role)
      return NextResponse.redirect(new URL(defaultRoute, request.url))
    }

    // 7. Crear respuesta y agregar headers con info del usuario
    const response = NextResponse.next()

    // Agregar información del usuario en headers personalizados
    // Estos headers están disponibles en getServerSideProps y API routes
    response.headers.set("X-User-Sub", session.sub)
    response.headers.set("X-User-Email", session.email)
    response.headers.set("X-User-Role", session.role)
    response.headers.set("X-User-Provider", session.provider)

    // 8. Refrescar sesión si está próxima a expirar
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
 * Verifica si un rol tiene acceso a una ruta específica
 */
function checkRoleAccess(
  role: "Organizador" | "Proveedor" | "Pagador",
  pathname: string
): boolean {
  const allowedRoutes = ROLE_ROUTES[role]
  return allowedRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Obtiene la ruta por defecto para un rol
 */
function getDefaultRouteForRole(role: "Organizador" | "Proveedor" | "Pagador"): string {
  const routes = {
    Organizador: "/dashboard",
    Proveedor: "/customer-dash",
    Pagador: "/product/1234asdf",
  }
  return routes[role]
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

