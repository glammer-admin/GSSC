import { NextRequest, NextResponse } from "next/server"
import { deleteSession, SESSION_COOKIE_NAME } from "@/lib/auth/session-manager"
import { getConfig } from "@/lib/config/env"

/**
 * POST /api/auth/logout
 * Endpoint para cerrar sesión y eliminar completamente la cookie
 * 
 * Medidas de seguridad:
 * 1. Elimina la cookie del servidor
 * 2. Invalida el token de sesión
 * 3. Limpia headers de autenticación
 * 4. Instruye al cliente a limpiar localStorage/sessionStorage
 */
export async function POST(request: NextRequest) {
  try {
    const config = getConfig()
    
    // 1. Eliminar la sesión y la cookie en el servidor
    await deleteSession()
    
    console.log("🚪 [LOGOUT] Sesión eliminada del servidor")

    // 2. Crear respuesta con headers de limpieza
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        redirect: "/",
        // Instruir al cliente a limpiar storage
        clearStorage: true,
      },
      { status: 200 }
    )

    // 3. Eliminar cookie - Método 1: Delete directo
    response.cookies.delete(SESSION_COOKIE_NAME)
    
    // 4. Eliminar cookie - Método 2: Expirar con configuración correcta del ambiente
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: config.secureCookies, // Usar configuración del ambiente
      sameSite: "lax",
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      domain: config.cookieDomain,
    })

    // 5. Método 3: Expirar sin flags (máxima compatibilidad)
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      domain: config.cookieDomain,
    })

    // 6. Agregar headers de seguridad adicionales
    response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"')
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    
    console.log("✅ [LOGOUT] Cookie eliminada y headers de limpieza establecidos")

    return response
  } catch (error) {
    console.error("❌ [LOGOUT] Error:", error)
    
    // Incluso en caso de error, intentar limpiar la cookie
    const errorResponse = NextResponse.json(
      { error: "Logout failed", message: "Session cleared anyway" },
      { status: 500 }
    )
    
    // Intentar eliminar con múltiples métodos
    const config = getConfig()
    errorResponse.cookies.delete(SESSION_COOKIE_NAME)
    errorResponse.cookies.set(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      domain: config.cookieDomain,
    })
    
    return errorResponse
  }
}

/**
 * GET /api/auth/logout
 * También permitir logout via GET para enlaces directos
 */
export async function GET(request: NextRequest) {
  try {
    const config = getConfig()
    
    // Eliminar sesión
    await deleteSession()
    
    console.log("🚪 [LOGOUT GET] Sesión eliminada")
    
    // Redirigir al home con cookie eliminada
    const response = NextResponse.redirect(new URL("/", request.url))
    
    // Método 1: Delete
    response.cookies.delete(SESSION_COOKIE_NAME)
    
    // Método 2: Expirar con config del ambiente
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      domain: config.cookieDomain,
    })

    // Método 3: Expirar sin flags (compatibilidad)
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      expires: new Date(0),
      domain: config.cookieDomain,
    })

    // Headers de limpieza
    response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"')
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    response.headers.set("Pragma", "no-cache")

    return response
  } catch (error) {
    console.error("❌ [LOGOUT GET] Error:", error)
    
    // Redirigir de todas formas
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

