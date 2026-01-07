import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getBillingClient, HttpError, NetworkError } from "@/lib/http/billing"
import type { BillingDocument } from "@/lib/types/billing/types"

interface DocumentsResponse {
  success: boolean
  data?: BillingDocument[]
  error?: string
}

interface DeprecatedResponse {
  success: boolean
  error: string
  message: string
}

/**
 * GET /api/settings/billing/documents
 * 
 * Obtiene todos los documentos de facturación del organizador actual
 */
export async function GET(): Promise<NextResponse<DocumentsResponse>> {
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

    const documents = await billingClient.getBillingDocuments(userId)

    return NextResponse.json({
      success: true,
      data: documents,
    })
  } catch (error) {
    console.error("Error loading billing documents:", error)
    
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
 * POST /api/settings/billing/documents
 * 
 * @deprecated Este endpoint está DEPRECADO desde v2.1
 * 
 * Los documentos ahora se envían junto con el formulario principal
 * en POST /api/settings/billing usando multipart/form-data.
 * 
 * Ver spec.md sección 9.4 para el nuevo contrato API.
 * Ver RN-22 y RN-23 para las reglas de negocio.
 * 
 * Este endpoint se mantiene temporalmente para compatibilidad,
 * pero retorna un error indicando que debe usarse el nuevo flujo.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<DeprecatedResponse>> {
  console.warn("⚠️ [DEPRECATED] POST /api/settings/billing/documents está deprecado. Use POST /api/settings/billing con multipart/form-data")
  
  return NextResponse.json(
    {
      success: false,
      error: "ENDPOINT_DEPRECATED",
      message: "Este endpoint está deprecado. Los documentos deben enviarse junto con el formulario principal en POST /api/settings/billing usando multipart/form-data. Ver spec.md sección 9.4 para más información.",
    },
    { status: 410 } // 410 Gone - indica que el recurso ya no está disponible
  )
}
