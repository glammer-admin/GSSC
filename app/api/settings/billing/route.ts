import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getBillingClient, getStorageClient, HttpError, NetworkError } from "@/lib/http/billing"
import {
  toBillingSettings,
  toBackendDocumentType,
  BILLING_DOCUMENTS_BUCKET,
  type BillingSettingsInput,
  type BillingSettingsResponse,
  type SaveBillingResponse,
  type CreateBillingProfileDTO,
  type UpdateBillingProfileDTO,
  type BillingDocumentType,
  type CreateBillingDocumentDTO,
} from "@/lib/types/billing/types"

// Configuración del runtime para Next.js App Router
// maxDuration aumenta el tiempo de ejecución para subidas de archivos
export const maxDuration = 60

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

    const userId = session.userId || session.sub
    const billingClient = getBillingClient()

    // Obtener todos los datos de billing
    const billingData = await billingClient.getBillingData(userId)

    // Convertir a formato legacy para compatibilidad con UI existente
    const settings = toBillingSettings(billingData, userId)

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("Error loading billing settings:", error)
    
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
 * Información de un archivo subido (para rollback)
 */
interface UploadedFile {
  path: string
  documentType: BillingDocumentType
}

/**
 * Realiza rollback de archivos ya subidos en caso de error
 */
async function rollbackUploadedFiles(uploadedFiles: UploadedFile[]): Promise<void> {
  const storageClient = getStorageClient()
  
  for (const file of uploadedFiles) {
    try {
      console.log(`🔄 [ROLLBACK] Eliminando archivo: ${file.path}`)
      await storageClient.deleteDocument(file.path)
      console.log(`✅ [ROLLBACK] Archivo eliminado: ${file.path}`)
    } catch (error) {
      // Log pero no fallar - el rollback es best-effort
      console.error(`❌ [ROLLBACK] Error eliminando ${file.path}:`, error)
    }
  }
}

/**
 * POST /api/settings/billing
 * 
 * Crea o actualiza la configuración de facturación del organizador.
 * 
 * IMPORTANTE (RN-22, RN-23):
 * - Acepta multipart/form-data con archivos adjuntos
 * - Los documentos se suben primero al Storage
 * - Si falla alguna subida, se hace rollback de los ya subidos
 * - Solo después de subir todos los documentos se guarda en BD
 * 
 * Campos esperados en FormData:
 * - data: JSON string con BillingSettingsInput
 * - id_document_file: File (opcional, solo para persona natural)
 * - rut_file: File (opcional, solo para persona jurídica)
 * - bank_certificate_file: File (obligatorio)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveBillingResponse>> {
  // Track de archivos subidos para rollback
  const uploadedFiles: UploadedFile[] = []
  
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

    // Parsear FormData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { success: false, error: "Formato de datos inválido. Use multipart/form-data." },
        { status: 400 }
      )
    }

    // Extraer datos JSON
    const dataString = formData.get("data") as string | null
    if (!dataString) {
      return NextResponse.json(
        { success: false, error: "El campo 'data' es obligatorio" },
        { status: 400 }
      )
    }

    let input: BillingSettingsInput
    try {
      input = JSON.parse(dataString)
    } catch {
      return NextResponse.json(
        { success: false, error: "El campo 'data' debe ser JSON válido" },
        { status: 400 }
      )
    }

    // Extraer archivos
    const idDocumentFile = formData.get("id_document_file") as File | null
    const rutFile = formData.get("rut_file") as File | null
    const bankCertificateFile = formData.get("bank_certificate_file") as File | null

    // Validar que se proporcione tipo de entidad
    if (!input.entityType) {
      return NextResponse.json(
        { success: false, error: "El tipo de entidad es obligatorio" },
        { status: 400 }
      )
    }

    const billingClient = getBillingClient()
    const storageClient = getStorageClient()

    // Verificar si ya existe un perfil
    const existingProfile = await billingClient.getBillingProfile(userId)
    const existingDocuments = await billingClient.getBillingDocuments(userId)

    // RN-01: Verificar si el tipo de entidad está bloqueado
    if (existingProfile && existingProfile.entity_type !== input.entityType) {
      return NextResponse.json(
        {
          success: false,
          error: "ENTITY_TYPE_LOCKED",
          message: "El tipo de entidad no puede cambiarse. Contacta a Soporte.",
        },
        { status: 400 }
      )
    }

    // Verificar documentos existentes
    const hasExistingIdDocument = existingDocuments.some(d => d.document_type === "id_document")
    const hasExistingRut = existingDocuments.some(d => d.document_type === "rut")
    const hasExistingBankCertificate = existingDocuments.some(d => d.document_type === "bank_certificate")

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
      // Validar formato de documento
      if (!/^\d{6,10}$/.test(documentNumber)) {
        return NextResponse.json(
          { success: false, error: "INVALID_DOCUMENT_NUMBER", message: "El número de documento debe tener entre 6 y 10 dígitos" },
          { status: 400 }
        )
      }
      // RN-05: Documento de identidad obligatorio (nuevo archivo o existente)
      if (!idDocumentFile && !hasExistingIdDocument) {
        return NextResponse.json(
          { success: false, error: "MISSING_ID_DOCUMENT", message: "La copia de la cédula es obligatoria" },
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
      // Validar formato de NIT
      if (!/^\d{9,10}$/.test(nit)) {
        return NextResponse.json(
          { success: false, error: "INVALID_TAX_ID", message: "El NIT debe tener entre 9 y 10 dígitos" },
          { status: 400 }
        )
      }
      // RN-06: RUT obligatorio (nuevo archivo o existente)
      if (!rutFile && !hasExistingRut) {
        return NextResponse.json(
          { success: false, error: "MISSING_RUT", message: "El RUT es obligatorio" },
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
    const { bankOrProvider, accountType, accountNumber } = input.bankInfo
    if (!bankOrProvider || !accountType || !accountNumber) {
      return NextResponse.json(
        { success: false, error: "Todos los campos bancarios son obligatorios" },
        { status: 400 }
      )
    }
    // Validar formato de número de cuenta
    if (!/^\d{6,20}$/.test(accountNumber)) {
      return NextResponse.json(
        { success: false, error: "INVALID_ACCOUNT_NUMBER", message: "El número de cuenta debe tener entre 6 y 20 dígitos" },
        { status: 400 }
      )
    }

    // RN-07: Certificación bancaria obligatoria (nuevo archivo o existente)
    if (!bankCertificateFile && !hasExistingBankCertificate) {
      return NextResponse.json(
        { success: false, error: "MISSING_BANK_CERTIFICATE", message: "La certificación bancaria es obligatoria" },
        { status: 400 }
      )
    }

    // ========================================
    // PASO 1: Subir documentos al Storage
    // (RN-22, RN-23: Subida atómica con rollback)
    // ========================================
    
    console.log("📤 [BILLING] Iniciando subida de documentos...")

    // Subir documento de identidad (si hay nuevo archivo)
    if (idDocumentFile) {
      try {
        const timestamp = Date.now()
        const sanitizedName = idDocumentFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const filename = `${timestamp}_${sanitizedName}`
        const fileBuffer = Buffer.from(await idDocumentFile.arrayBuffer())
        
        const result = await storageClient.uploadDocument(userId, "id_document", fileBuffer, filename)
        
        if (!result.success) {
          throw new Error(result.error || "Error al subir documento de identidad")
        }
        
        uploadedFiles.push({ path: result.path, documentType: "id_document" })
        console.log(`✅ [BILLING] Documento de identidad subido: ${result.path}`)
      } catch (error) {
        console.error("❌ [BILLING] Error subiendo documento de identidad:", error)
        await rollbackUploadedFiles(uploadedFiles)
        return NextResponse.json(
          { 
            success: false, 
            error: "DOCUMENT_UPLOAD_FAILED", 
            message: "Error al subir el documento de identidad. Intenta nuevamente." 
          },
          { status: 500 }
        )
      }
    }

    // Subir RUT (si hay nuevo archivo)
    if (rutFile) {
      try {
        const timestamp = Date.now()
        const sanitizedName = rutFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const filename = `${timestamp}_${sanitizedName}`
        const fileBuffer = Buffer.from(await rutFile.arrayBuffer())
        
        const result = await storageClient.uploadDocument(userId, "rut", fileBuffer, filename)
        
        if (!result.success) {
          throw new Error(result.error || "Error al subir RUT")
        }
        
        uploadedFiles.push({ path: result.path, documentType: "rut" })
        console.log(`✅ [BILLING] RUT subido: ${result.path}`)
      } catch (error) {
        console.error("❌ [BILLING] Error subiendo RUT:", error)
        await rollbackUploadedFiles(uploadedFiles)
        return NextResponse.json(
          { 
            success: false, 
            error: "DOCUMENT_UPLOAD_FAILED", 
            message: "Error al subir el RUT. Intenta nuevamente." 
          },
          { status: 500 }
        )
      }
    }

    // Subir certificación bancaria (si hay nuevo archivo)
    if (bankCertificateFile) {
      try {
        const timestamp = Date.now()
        const sanitizedName = bankCertificateFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const filename = `${timestamp}_${sanitizedName}`
        const fileBuffer = Buffer.from(await bankCertificateFile.arrayBuffer())
        
        const result = await storageClient.uploadDocument(userId, "bank_certificate", fileBuffer, filename)
        
        if (!result.success) {
          throw new Error(result.error || "Error al subir certificación bancaria")
        }
        
        uploadedFiles.push({ path: result.path, documentType: "bank_certificate" })
        console.log(`✅ [BILLING] Certificación bancaria subida: ${result.path}`)
      } catch (error) {
        console.error("❌ [BILLING] Error subiendo certificación bancaria:", error)
        await rollbackUploadedFiles(uploadedFiles)
        return NextResponse.json(
          { 
            success: false, 
            error: "DOCUMENT_UPLOAD_FAILED", 
            message: "Error al subir la certificación bancaria. Intenta nuevamente." 
          },
          { status: 500 }
        )
      }
    }

    console.log(`📤 [BILLING] Documentos subidos exitosamente: ${uploadedFiles.length}`)

    // ========================================
    // PASO 2: Guardar datos en base de datos
    // ========================================
    
    try {
      let savedProfile

      if (existingProfile) {
        // Actualizar perfil existente
        const updateData: UpdateBillingProfileDTO = {
          fiscal_address: address,
          contact_email: email,
          contact_phone: phone,
        }

        if (input.entityType === "natural" && input.naturalPersonInfo) {
          updateData.full_name = input.naturalPersonInfo.fullName
          updateData.document_type = toBackendDocumentType(input.naturalPersonInfo.documentType)
          updateData.document_number = input.naturalPersonInfo.documentNumber
        } else if (input.entityType === "legal" && input.legalEntityInfo) {
          updateData.full_name = input.legalEntityInfo.businessName
          updateData.tax_id = input.legalEntityInfo.nit
        }

        savedProfile = await billingClient.updateBillingProfile(userId, updateData)
      } else {
        // Crear nuevo perfil
        const createData: CreateBillingProfileDTO = {
          user_id: userId,
          entity_type: input.entityType,
          full_name: input.entityType === "natural" 
            ? input.naturalPersonInfo!.fullName 
            : input.legalEntityInfo!.businessName,
          document_type: input.entityType === "natural"
            ? toBackendDocumentType(input.naturalPersonInfo!.documentType)
            : "CC", // Default para legal, el documento principal es el RUT
          document_number: input.entityType === "natural"
            ? input.naturalPersonInfo!.documentNumber
            : "0000000000", // Placeholder para legal
          fiscal_address: address,
          contact_email: email,
          contact_phone: phone,
        }

        if (input.entityType === "legal" && input.legalEntityInfo) {
          createData.tax_id = input.legalEntityInfo.nit
        }

        savedProfile = await billingClient.createBillingProfile(createData)
      }

      // RN-14 (v2.4): Siempre crear nueva cuenta bancaria
      // Todas las cuentas se crean activas por defecto
      // RN-13 (v2.4): Las cuentas NUNCA se marcan como preferidas automáticamente
      // El usuario debe seleccionar manualmente la cuenta preferida después de verificación
      await billingClient.createBankAccount({
        user_id: userId,
        bank_name: bankOrProvider,
        account_type: accountType,
        account_number: accountNumber,
        is_active: true,
        is_preferred: false,
      })

      // Crear referencias de documentos en BD
      for (const uploadedFile of uploadedFiles) {
        const createDocData: CreateBillingDocumentDTO = {
          user_id: userId,
          document_type: uploadedFile.documentType,
          document_name: uploadedFile.path.split("/").pop() || uploadedFile.documentType,
          storage_bucket: BILLING_DOCUMENTS_BUCKET,
          storage_path: uploadedFile.path,
        }
        await billingClient.createBillingDocument(createDocData)
      }

      // Obtener datos actualizados
      const billingData = await billingClient.getBillingData(userId)
      const settings = toBillingSettings(billingData, userId)

      console.log("✅ [BILLING] Configuración guardada exitosamente")

      return NextResponse.json({
        success: true,
        data: settings,
        message: "Configuración guardada exitosamente",
      })
    } catch (dbError) {
      // Si falla el guardado en BD, hacer rollback de archivos
      console.error("❌ [BILLING] Error guardando en BD, ejecutando rollback:", dbError)
      await rollbackUploadedFiles(uploadedFiles)
      throw dbError
    }
  } catch (error) {
    console.error("Error saving billing settings:", error)
    
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
