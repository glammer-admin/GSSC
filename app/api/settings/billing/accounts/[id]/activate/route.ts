import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getBillingClient, HttpError, NetworkError } from "@/lib/http/billing"
import type { BankAccount } from "@/lib/types/billing/types"

interface ActivateAccountResponse {
  success: boolean
  data?: BankAccount
  error?: string
  message?: string
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/settings/billing/accounts/[id]/activate
 * 
 * Activa una cuenta bancaria (desactiva las demás automáticamente)
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ActivateAccountResponse>> {
  try {
    const { id } = await params
    
    // Validar sesión
    const session = await getSession()
    
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar rol organizer
    if (session.role !== "organizer") {
      return NextResponse.json(
        { success: false, error: "Acceso denegado" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub
    const billingClient = getBillingClient()

    // Verificar que la cuenta existe y pertenece al usuario
    const existingAccount = await billingClient.getBankAccountById(id)
    
    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: "Cuenta no encontrada" },
        { status: 404 }
      )
    }

    if (existingAccount.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado" },
        { status: 403 }
      )
    }

    // Si ya está activa, no hacer nada
    if (existingAccount.is_active) {
      return NextResponse.json({
        success: true,
        data: existingAccount,
        message: "La cuenta ya está activa",
      })
    }

    // Activar la cuenta (el backend desactiva las demás automáticamente)
    const account = await billingClient.activateBankAccount(id)

    return NextResponse.json({
      success: true,
      data: account,
      message: "Cuenta bancaria activada exitosamente",
    })
  } catch (error) {
    console.error("Error activating bank account:", error)
    
    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, error: `Error del servidor: ${error.status}` },
        { status: error.status }
      )
    }
    
    if (error instanceof NetworkError) {
      return NextResponse.json(
        { success: false, error: "Error de conexión con el servidor" },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

