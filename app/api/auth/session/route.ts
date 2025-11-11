import { NextRequest, NextResponse } from "next/server"
import { getSession, refreshSession, isSessionExpiringSoon } from "@/lib/auth/session-manager"

/**
 * GET /api/auth/session
 * Endpoint para obtener la sesión actual del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      )
    }

    // Refrescar automáticamente si está por expirar
    if (isSessionExpiringSoon(session)) {
      await refreshSession()
    }

    // Retornar datos del usuario sin información sensible
    return NextResponse.json(
      {
        user: {
          sub: session.sub,
          email: session.email,
          name: session.name,
          picture: session.picture,
          role: session.role,
          provider: session.provider,
        },
        expiresAt: session.exp * 1000, // Convertir a milisegundos
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get session error:", error)
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/session/refresh
 * Endpoint para refrescar manualmente la sesión
 */
export async function POST(request: NextRequest) {
  try {
    const success = await refreshSession()

    if (!success) {
      return NextResponse.json(
        { error: "Failed to refresh session" },
        { status: 401 }
      )
    }

    const session = await getSession()

    return NextResponse.json(
      {
        success: true,
        expiresAt: session?.exp ? session.exp * 1000 : null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Refresh session error:", error)
    return NextResponse.json(
      { error: "Failed to refresh session" },
      { status: 500 }
    )
  }
}

