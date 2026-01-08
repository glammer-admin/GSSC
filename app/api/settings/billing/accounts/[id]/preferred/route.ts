import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getBillingClient, HttpError, NetworkError } from "@/lib/http/billing"
import type { BankAccount } from "@/lib/types/billing/types"

interface SetPreferredAccountResponse {
  success: boolean
  data?: BankAccount
  error?: string
  message?: string
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/settings/billing/accounts/[id]/preferred
 * 
 * Marca una cuenta bancaria como preferida (para recibir pagos).
 * 
 * Restricciones:
 * - Requiere is_active=true AND status=verified
 * - Error CANNOT_SET_PREFERRED_INACTIVE si la cuenta está inactiva
 * - Error CANNOT_SET_PREFERRED_UNVERIFIED si la cuenta no está verificada
 * - Al marcar como preferida, la cuenta preferida anterior se desmarca automáticamente
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SetPreferredAccountResponse>> {
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

    // Si ya está como preferida, no hacer nada
    if (existingAccount.is_preferred) {
      return NextResponse.json({
        success: true,
        data: existingAccount,
        message: "La cuenta ya está marcada como preferida",
      })
    }

    // RN-17: Una cuenta inactiva no puede ser seleccionada como preferida
    if (!existingAccount.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          error: "CANNOT_SET_PREFERRED_INACTIVE",
          message: "Cuenta inactiva. Reactívela primero" 
        },
        { status: 400 }
      )
    }

    // RN-11: Para marcar como preferida, debe estar verificada
    if (existingAccount.status !== "verified") {
      return NextResponse.json(
        { 
          success: false, 
          error: "CANNOT_SET_PREFERRED_UNVERIFIED",
          message: "Solo cuentas verificadas pueden ser seleccionadas como preferidas" 
        },
        { status: 400 }
      )
    }

    // Desmarcar la cuenta preferida anterior (si existe)
    const currentPreferred = await billingClient.getPreferredBankAccount(userId)
    if (currentPreferred && currentPreferred.id !== id) {
      await billingClient.unsetPreferredBankAccount(currentPreferred.id)
    }

    // Marcar la nueva cuenta como preferida
    const account = await billingClient.setPreferredBankAccount(id)

    return NextResponse.json({
      success: true,
      data: account,
      message: "Cuenta bancaria marcada como preferida exitosamente",
    })
  } catch (error) {
    console.error("Error setting preferred bank account:", error)
    
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

