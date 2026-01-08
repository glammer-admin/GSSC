import { NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getBillingClient, HttpError, NetworkError } from "@/lib/http/billing"
import type { PaymentEligibilityResponse } from "@/lib/types/billing/types"

interface EligibilityApiResponse {
  success: boolean
  data?: PaymentEligibilityResponse
  error?: string
}

/**
 * GET /api/settings/billing/eligibility
 * 
 * Verifica la elegibilidad de pagos del organizador actual
 */
export async function GET(): Promise<NextResponse<EligibilityApiResponse>> {
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

    const eligibility = await billingClient.checkPaymentEligibility(userId)

    return NextResponse.json({
      success: true,
      data: eligibility,
    })
  } catch (error) {
    console.error("Error checking payment eligibility:", error)
    
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

