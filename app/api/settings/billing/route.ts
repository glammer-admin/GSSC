import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import {
  loadBillingSettings,
  saveBillingSettings,
  isEntityTypeLocked,
} from "@/lib/mocks/billing-loader"
import type {
  BillingSettingsInput,
  BillingSettingsResponse,
  SaveBillingResponse,
} from "@/lib/types/billing/types"

/**
 * GET /api/settings/billing
 * 
 * Obtiene la configuración de facturación del organizador actual
 */
export async function GET(): Promise<NextResponse<BillingSettingsResponse>> {
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

    const organizerId = session.userId || session.sub
    const settings = loadBillingSettings(organizerId)

    return NextResponse.json({
      success: true,
      data: settings ?? undefined,
    })
  } catch (error) {
    console.error("Error loading billing settings:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/billing
 * 
 * Crea o actualiza la configuración de facturación del organizador
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveBillingResponse>> {
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

    const organizerId = session.userId || session.sub

    // Parsear body
    let input: BillingSettingsInput
    try {
      input = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Datos inválidos" },
        { status: 400 }
      )
    }

    // Validar que se proporcione tipo de entidad
    if (!input.entityType) {
      return NextResponse.json(
        { success: false, error: "El tipo de entidad es obligatorio" },
        { status: 400 }
      )
    }

    // Cargar configuración existente
    const existingSettings = loadBillingSettings(organizerId)

    // RN-01: Verificar si el tipo de entidad está bloqueado
    if (isEntityTypeLocked(organizerId)) {
      if (existingSettings?.entityType !== input.entityType) {
        return NextResponse.json(
          {
            success: false,
            error: "ENTITY_TYPE_LOCKED",
            message: "El tipo de entidad no puede cambiarse. Contacta a Soporte.",
          },
          { status: 400 }
        )
      }
    }

    // Validaciones según tipo de entidad
    if (input.entityType === "natural") {
      if (!input.naturalPersonInfo) {
        return NextResponse.json(
          { success: false, error: "La información legal es obligatoria" },
          { status: 400 }
        )
      }
      const { fullName, documentType, documentNumber, fiscalAddress } = input.naturalPersonInfo
      if (!fullName || !documentType || !documentNumber || !fiscalAddress) {
        return NextResponse.json(
          { success: false, error: "Todos los campos de información legal son obligatorios" },
          { status: 400 }
        )
      }
    } else if (input.entityType === "legal") {
      if (!input.legalEntityInfo) {
        return NextResponse.json(
          { success: false, error: "La información legal es obligatoria" },
          { status: 400 }
        )
      }
      const { businessName, nit, fiscalAddress } = input.legalEntityInfo
      if (!businessName || !nit || !fiscalAddress) {
        return NextResponse.json(
          { success: false, error: "Todos los campos de información legal son obligatorios" },
          { status: 400 }
        )
      }
    }

    // Validar datos de contacto
    if (!input.contactInfo) {
      return NextResponse.json(
        { success: false, error: "Los datos de contacto son obligatorios" },
        { status: 400 }
      )
    }
    const { email, phone, address } = input.contactInfo
    if (!email || !phone || !address) {
      return NextResponse.json(
        { success: false, error: "Todos los campos de contacto son obligatorios" },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "INVALID_EMAIL_FORMAT", message: "El formato del email no es válido" },
        { status: 400 }
      )
    }

    // Validar información bancaria
    if (!input.bankInfo) {
      return NextResponse.json(
        { success: false, error: "La información bancaria es obligatoria" },
        { status: 400 }
      )
    }
    const { accountHolder, bankOrProvider, accountType, accountNumber } = input.bankInfo
    if (!accountHolder || !bankOrProvider || !accountType || !accountNumber) {
      return NextResponse.json(
        { success: false, error: "Todos los campos bancarios son obligatorios" },
        { status: 400 }
      )
    }

    // Guardar configuración
    const savedSettings = saveBillingSettings(organizerId, input, existingSettings)

    return NextResponse.json({
      success: true,
      data: savedSettings,
      message: "Configuración guardada exitosamente",
    })
  } catch (error) {
    console.error("Error saving billing settings:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

