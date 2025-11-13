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

    console.log("📥 [AUTH CALLBACK] Request received")
    console.log("📥 [AUTH CALLBACK] Provider:", provider)
    console.log("📥 [AUTH CALLBACK] Has idToken:", !!idToken)
    console.log("📥 [AUTH CALLBACK] Token length:", idToken?.length)

    // 1. Validar que se proporcionen los datos necesarios
    if (!idToken || !provider) {
      console.error("❌ [AUTH CALLBACK] Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields", fields: ["idToken", "provider"] },
        { status: 400 }
      )
    }

    // 2. Validar que el proveedor sea soportado
    if (!["google", "microsoft", "meta"].includes(provider)) {
      console.error("❌ [AUTH CALLBACK] Invalid provider:", provider)
      return NextResponse.json(
        { error: "Invalid provider", supported: ["google", "microsoft", "meta"] },
        { status: 400 }
      )
    }

    console.log("🔍 [AUTH CALLBACK] Validating token with provider:", provider)

    // 3. Validar el ID Token con el proveedor correspondiente
    // Esto verifica la firma, emisor, audiencia y expiración
    const tokenPayload = await validateIdToken(idToken, provider)
    
    console.log("✅ [AUTH CALLBACK] Token validated successfully")
    console.log("✅ [AUTH CALLBACK] User:", tokenPayload.email)

    // 4. Extraer información del usuario del token validado
    const { sub, email, name, picture } = tokenPayload

    console.log("📦 [AUTH CALLBACK] Extracted data:", { sub, email, name, picture: !!picture })

    // Verificar que el email esté verificado (para Google)
    if (provider === "google" && !tokenPayload.email_verified) {
      console.error("❌ [AUTH CALLBACK] Email not verified for Google")
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

    console.log("👤 [AUTH CALLBACK] Assigning role:", role)

    // 6. Crear sesión segura con cookie HttpOnly
    console.log("🍪 [AUTH CALLBACK] Creating session cookie...")
    
    try {
      await setSessionCookie({
        sub,
        email,
        name,
        picture,
        provider,
        role,
      })
      console.log("✅ [AUTH CALLBACK] Session cookie created successfully")
    } catch (cookieError) {
      console.error("❌ [AUTH CALLBACK] Error creating session cookie:", cookieError)
      throw cookieError
    }

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

