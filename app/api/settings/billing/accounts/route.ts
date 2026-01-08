import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getBillingClient, HttpError, NetworkError } from "@/lib/http/billing"
import type { BankAccount, CreateBankAccountDTO, AccountType } from "@/lib/types/billing/types"

interface BankAccountsResponse {
  success: boolean
  data?: BankAccount[]
  error?: string
}

interface CreateBankAccountResponse {
  success: boolean
  data?: BankAccount
  error?: string
  message?: string
}

/**
 * GET /api/settings/billing/accounts
 * 
 * Obtiene todas las cuentas bancarias del organizador actual
 */
export async function GET(): Promise<NextResponse<BankAccountsResponse>> {
  try {
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

    const accounts = await billingClient.getBankAccounts(userId)

    return NextResponse.json({
      success: true,
      data: accounts,
    })
  } catch (error) {
    console.error("Error loading bank accounts:", error)
    
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
 * POST /api/settings/billing/accounts
 * 
 * Crea una nueva cuenta bancaria
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateBankAccountResponse>> {
  try {
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

    // Parsear body
    let input: {
      bank_name: string
      account_type: AccountType
      account_number: string
    }
    
    try {
      input = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Datos inválidos" },
        { status: 400 }
      )
    }

    // Validaciones (v2.2 - sin holder_name)
    if (!input.bank_name || !input.account_type || !input.account_number) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 }
      )
    }

    // Validar formato de número de cuenta
    if (!/^\d{6,20}$/.test(input.account_number)) {
      return NextResponse.json(
        { success: false, error: "INVALID_ACCOUNT_NUMBER", message: "El número de cuenta debe tener entre 6 y 20 dígitos" },
        { status: 400 }
      )
    }

    // Validar tipo de cuenta
    const validAccountTypes: AccountType[] = ["savings", "checking", "wallet"]
    if (!validAccountTypes.includes(input.account_type)) {
      return NextResponse.json(
        { success: false, error: "Tipo de cuenta inválido" },
        { status: 400 }
      )
    }

    const billingClient = getBillingClient()

    const createData: CreateBankAccountDTO = {
      user_id: userId,
      bank_name: input.bank_name,
      account_type: input.account_type,
      account_number: input.account_number,
      // RN-14 (v2.4): Todas las cuentas se crean activas por defecto
      // RN-13 (v2.4): Las cuentas NUNCA se marcan como preferidas automáticamente
      // El usuario debe seleccionar manualmente la cuenta preferida después de verificación
      is_active: true,
      is_preferred: false,
    }

    const account = await billingClient.createBankAccount(createData)

    return NextResponse.json({
      success: true,
      data: account,
      message: "Cuenta bancaria creada exitosamente",
    })
  } catch (error) {
    console.error("Error creating bank account:", error)
    
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

