import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getBillingClient, HttpError, NetworkError } from "@/lib/http/billing"
import type { BankAccount, UpdateBankAccountDTO, AccountType } from "@/lib/types/billing/types"

interface BankAccountResponse {
  success: boolean
  data?: BankAccount
  error?: string
  message?: string
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/settings/billing/accounts/[id]
 * 
 * Obtiene una cuenta bancaria específica
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<BankAccountResponse>> {
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

    const account = await billingClient.getBankAccountById(id)

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Cuenta no encontrada" },
        { status: 404 }
      )
    }

    // Verificar que la cuenta pertenece al usuario
    if (account.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: account,
    })
  } catch (error) {
    console.error("Error loading bank account:", error)
    
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

/**
 * PATCH /api/settings/billing/accounts/[id]
 * 
 * Actualiza una cuenta bancaria
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<BankAccountResponse>> {
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

    // Parsear body
    let input: Partial<{
      holder_name: string
      bank_name: string
      account_type: AccountType
      account_number: string
    }>
    
    try {
      input = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Datos inválidos" },
        { status: 400 }
      )
    }

    // Validar formato de número de cuenta si se proporciona
    if (input.account_number && !/^\d{6,20}$/.test(input.account_number)) {
      return NextResponse.json(
        { success: false, error: "INVALID_ACCOUNT_NUMBER", message: "El número de cuenta debe tener entre 6 y 20 dígitos" },
        { status: 400 }
      )
    }

    // Validar tipo de cuenta si se proporciona
    if (input.account_type) {
      const validAccountTypes: AccountType[] = ["savings", "checking", "wallet"]
      if (!validAccountTypes.includes(input.account_type)) {
        return NextResponse.json(
          { success: false, error: "Tipo de cuenta inválido" },
          { status: 400 }
        )
      }
    }

    const updateData: UpdateBankAccountDTO = {}
    if (input.holder_name) updateData.holder_name = input.holder_name
    if (input.bank_name) updateData.bank_name = input.bank_name
    if (input.account_type) updateData.account_type = input.account_type
    if (input.account_number) updateData.account_number = input.account_number

    const account = await billingClient.updateBankAccount(id, updateData)

    return NextResponse.json({
      success: true,
      data: account,
      message: "Cuenta bancaria actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error updating bank account:", error)
    
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

/**
 * DELETE /api/settings/billing/accounts/[id]
 * 
 * Elimina una cuenta bancaria (solo si no está activa)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<BankAccountResponse>> {
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

    // No permitir eliminar cuenta activa
    if (existingAccount.is_active) {
      return NextResponse.json(
        { success: false, error: "No se puede eliminar la cuenta activa. Activa otra cuenta primero." },
        { status: 400 }
      )
    }

    // Nota: El backend no tiene endpoint de DELETE, solo desactivamos
    // En una implementación real, habría un endpoint DELETE
    return NextResponse.json(
      { success: false, error: "La eliminación de cuentas no está disponible. Desactiva la cuenta en su lugar." },
      { status: 501 }
    )
  } catch (error) {
    console.error("Error deleting bank account:", error)
    
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

