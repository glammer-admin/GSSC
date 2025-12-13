import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/auth/microsoft/token
 * Intercambia el authorization code por tokens usando Client Secret en el servidor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, code_verifier } = body

    console.log("📥 [MICROSOFT] Token exchange request received")
    console.log("📥 [MICROSOFT] Has code:", !!code)
    console.log("📥 [MICROSOFT] Has code_verifier:", !!code_verifier)

    if (!code || !code_verifier) {
      console.error("❌ [MICROSOFT] Missing required parameters")
      return NextResponse.json(
        { error: "Missing code or code_verifier" },
        { status: 400 }
      )
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

    console.log("🔑 [MICROSOFT] Client ID:", clientId?.substring(0, 20) + "...")
    console.log("🔑 [MICROSOFT] Client Secret:", clientSecret ? "✓ configurado" : "✗ falta")

    if (!clientId || !clientSecret) {
      console.error("[AUTH-CFG-002] Missing OAuth credentials in .env")
      return NextResponse.json(
        { error: "Server configuration error", errorCode: "AUTH-CFG-002" },
        { status: 500 }
      )
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/microsoft/callback`
    const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token"

    console.log("🔗 [MICROSOFT] Redirect URI:", redirectUri)

    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "openid email profile User.Read",
      code: code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: code_verifier,
    })

    console.log("🔒 [MICROSOFT] Intercambiando authorization code por tokens...")

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody.toString(),
    })

    console.log("📡 [MICROSOFT] Response status:", response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error("[AUTH-TKN-001] Token exchange error:", JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: "Token exchange failed", 
          errorCode: "AUTH-TKN-001",
          details: error.error_description || error.error 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    console.log("📦 [MICROSOFT] Response keys:", Object.keys(data))
    console.log("📦 [MICROSOFT] Has id_token:", !!data.id_token)
    console.log("📦 [MICROSOFT] Has access_token:", !!data.access_token)

    if (!data.id_token) {
      console.error("[AUTH-TKN-002] No ID token in response")
      return NextResponse.json(
        { error: "No ID token received from Microsoft", errorCode: "AUTH-TKN-002" },
        { status: 500 }
      )
    }

    console.log("✅ [MICROSOFT] ID Token obtenido exitosamente")

    // Retornar solo el ID token (no exponer access_token al cliente innecesariamente)
    return NextResponse.json({
      success: true,
      id_token: data.id_token,
    })
  } catch (error) {
    console.error("[ERR-GEN-000] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error", errorCode: "ERR-GEN-000", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

