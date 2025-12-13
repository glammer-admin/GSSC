import { NextRequest, NextResponse } from "next/server"
import { validateIdToken } from "@/lib/auth/jwt-validator"
import { 
  setSessionCookie, 
  setTemporarySessionCookie,
  deleteSession,
  type SessionRole 
} from "@/lib/auth/session-manager"
import { getUsersClient } from "@/lib/http/users/users-client"
import { 
  ROLE_DASHBOARD_MAP,
  type UserRole 
} from "@/lib/http/users/types"
import { HttpError, NetworkError } from "@/lib/http/client"
import { ERROR_CODES, formatErrorLog } from "@/lib/errors/error-codes"

/**
 * POST /api/auth/callback
 * Endpoint para recibir y validar el ID Token del proveedor SSO
 * Luego valida el usuario en la BD y determina el flujo apropiado
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

    // 5. Consultar usuario en la base de datos externa
    console.log("🔍 [AUTH CALLBACK] Looking up user in database...")
    
    let dbUser = null
    try {
      const usersClient = getUsersClient()
      dbUser = await usersClient.getUserByEmail(email)
    } catch (dbError) {
      // Manejar errores de BD con códigos específicos
      console.error("❌ [AUTH CALLBACK] Database error:", dbError)
      
      // Eliminar cualquier cookie de sesión creada
      await deleteSession()
      
      // Determinar el tipo de error y código correspondiente
      if (dbError instanceof NetworkError) {
        const errorCode = ERROR_CODES.AUTH_NET_001.code
        console.error(formatErrorLog(errorCode, dbError.message))
        return NextResponse.json(
          {
            error: true,
            message: ERROR_CODES.AUTH_NET_001.userMessage,
            redirect: `/error?code=${errorCode}`,
          },
          { status: 503 }
        )
      }
      
      if (dbError instanceof HttpError && dbError.status >= 500) {
        const errorCode = ERROR_CODES.AUTH_SRV_001.code
        console.error(formatErrorLog(errorCode, `HTTP ${dbError.status}: ${dbError.statusText}`))
        return NextResponse.json(
          {
            error: true,
            message: ERROR_CODES.AUTH_SRV_001.userMessage,
            redirect: `/error?code=${errorCode}`,
          },
          { status: 503 }
        )
      }
      
      // Error genérico de BD
      const errorCode = ERROR_CODES.ERR_GEN_000.code
      console.error(formatErrorLog(errorCode, dbError instanceof Error ? dbError.message : "Unknown database error"))
      return NextResponse.json(
        {
          error: true,
          message: ERROR_CODES.ERR_GEN_000.userMessage,
          redirect: `/error?code=${errorCode}`,
        },
        { status: 500 }
      )
    }

    // 6. Determinar flujo según estado del usuario
    if (!dbUser) {
      // CASO: Usuario nuevo - necesita onboarding
      console.log("👤 [AUTH CALLBACK] New user detected, redirecting to onboarding")
      
      await setTemporarySessionCookie({
        sub,
        email,
        name,
        picture,
        provider,
        role: null,
        needsOnboarding: true,
      })

      return NextResponse.json(
        {
          success: true,
          user: { sub, email, name, picture },
          needsOnboarding: true,
          redirect: "/onboarding",
        },
        { status: 200 }
      )
    }

    // Usuario existe en BD
    const userRoles = dbUser.role
    console.log("👤 [AUTH CALLBACK] Existing user found with roles:", userRoles)

    if (userRoles.length === 0) {
      // CASO: Usuario sin roles (no debería pasar, pero manejamos el caso)
      console.warn("⚠️ [AUTH CALLBACK] User has no roles, redirecting to onboarding")
      
      await setTemporarySessionCookie({
        sub,
        email,
        name,
        picture,
        provider,
        role: null,
        needsOnboarding: true,
      })

      return NextResponse.json(
        {
          success: true,
          user: { sub, email, name, picture },
          needsOnboarding: true,
          redirect: "/onboarding",
        },
        { status: 200 }
      )
    }

    if (userRoles.length === 1) {
      // CASO: Usuario con un solo rol - acceso directo
      const userRole = userRoles[0] as UserRole
      const redirectUrl = ROLE_DASHBOARD_MAP[userRole]

      console.log("✅ [AUTH CALLBACK] Single role user, assigning role:", userRole)

      await setSessionCookie({
        sub,
        email,
        name,
        picture,
        provider,
        role: userRole,
        userId: dbUser.id,
      })

      return NextResponse.json(
        {
          success: true,
          user: {
            sub,
            email,
            name,
            picture,
            role: userRole,
            userId: dbUser.id,
          },
          redirect: redirectUrl,
        },
        { status: 200 }
      )
    }

    // CASO: Usuario con múltiples roles - necesita seleccionar
    console.log("👤 [AUTH CALLBACK] Multiple roles detected, redirecting to role selection")
    
    await setTemporarySessionCookie({
      sub,
      email,
      name,
      picture,
      provider,
      role: null,
      needsRoleSelection: true,
      availableRoles: userRoles,
    })

    return NextResponse.json(
      {
        success: true,
        user: { sub, email, name, picture },
        needsRoleSelection: true,
        availableRoles: userRoles,
        redirect: "/select-role",
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Auth callback error:", error)
    
    // Eliminar cualquier cookie de sesión en caso de error
    await deleteSession()

    // Determinar tipo de error para respuesta apropiada
    const errorMessage = error instanceof Error ? error.message : "Authentication failed"
    
    // Si es error de validación de token
    if (errorMessage.includes("Invalid") || errorMessage.includes("expired")) {
      const errorCode = ERROR_CODES.AUTH_VAL_001.code
      console.error(formatErrorLog(errorCode, errorMessage))
      return NextResponse.json(
        {
          error: true,
          message: ERROR_CODES.AUTH_VAL_001.userMessage,
          redirect: `/error?code=${errorCode}`,
        },
        { status: 401 }
      )
    }

    // Error genérico
    const errorCode = ERROR_CODES.ERR_GEN_000.code
    console.error(formatErrorLog(errorCode, errorMessage))
    return NextResponse.json(
      {
        error: true,
        message: ERROR_CODES.ERR_GEN_000.userMessage,
        redirect: `/error?code=${errorCode}`,
      },
      { status: 500 }
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
