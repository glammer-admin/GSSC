import { NextRequest, NextResponse } from "next/server"
import { validateIdToken } from "@/lib/auth/jwt-validator"
import { setSessionCookie } from "@/lib/auth/session-manager"

/**
 * POST /api/auth/callback
 * Endpoint para recibir y validar el ID Token del proveedor SSO
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken, provider } = body

    // 1. Validar que se proporcionen los datos necesarios
    if (!idToken || !provider) {
      return NextResponse.json(
        { error: "Missing required fields", fields: ["idToken", "provider"] },
        { status: 400 }
      )
    }

    // 2. Validar que el proveedor sea soportado
    if (!["google", "microsoft", "meta"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider", supported: ["google", "microsoft", "meta"] },
        { status: 400 }
      )
    }

    // 3. Validar el ID Token con el proveedor correspondiente
    // Esto verifica la firma, emisor, audiencia y expiración
    const tokenPayload = await validateIdToken(idToken, provider)

    // 4. Extraer información del usuario del token validado
    const { sub, email, name, picture } = tokenPayload

    // Verificar que el email esté verificado (para Google)
    if (provider === "google" && !tokenPayload.email_verified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      )
    }

    // 5. Asignar rol basado en el proveedor (lógica de negocio)
    const roleMap = {
      google: "Organizador" as const,
      microsoft: "Proveedor" as const,
      meta: "Pagador" as const,
    }
    const role = roleMap[provider]

    // 6. Crear sesión segura con cookie HttpOnly
    await setSessionCookie({
      sub,
      email,
      name,
      picture,
      provider,
      role,
    })

    // 7. Determinar ruta de redirección según el rol
    const redirectMap = {
      Organizador: "/dashboard",
      Proveedor: "/customer-dash",
      Pagador: "/product/1234asdf",
    }

    // 8. Retornar respuesta exitosa con información del usuario
    return NextResponse.json(
      {
        success: true,
        user: {
          sub,
          email,
          name,
          picture,
          role,
        },
        redirect: redirectMap[role],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Auth callback error:", error)

    // Determinar tipo de error para respuesta apropiada
    const errorMessage = error instanceof Error ? error.message : "Authentication failed"
    const statusCode = errorMessage.includes("Invalid") ? 401 : 500

    return NextResponse.json(
      {
        error: "Authentication failed",
        message: errorMessage,
      },
      { status: statusCode }
    )
  }
}

/**
 * Endpoint de salud para verificar que el servicio está disponible
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", endpoint: "auth/callback" },
    { status: 200 }
  )
}

