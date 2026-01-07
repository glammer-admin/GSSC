/**
 * Tipos del dominio de Facturación y Pagos
 * 
 * Basado en spec.md v2.0 - Configuración de Facturación y Pagos
 * Modelo de datos: billing_profiles, bank_accounts, billing_documents
 */

// ============================================================
// Enums y tipos base
// ============================================================

/** Tipo de entidad (RN-01: Solo puede seleccionarse una vez) */
export type EntityType = "natural" | "legal"

/** Tipo de documento de identidad del backend */
export type BackendDocumentType = "CC" | "CE" | "PASSPORT"

/** Tipo de documento de identidad para UI */
export type DocumentType = "cedula_ciudadania" | "cedula_extranjeria" | "passport"

/** Tipo de cuenta bancaria */
export type AccountType = "savings" | "checking" | "wallet"

/** Estado de verificación de cuenta bancaria */
export type VerificationStatus = "pending" | "verified" | "rejected"

/** Tipo de documento de facturación */
export type BillingDocumentType = "id_document" | "rut" | "bank_certificate"

// ============================================================
// Modelos del Backend (mapean a las tablas de Supabase)
// ============================================================

/**
 * Perfil de Facturación (billing_profiles)
 * Contiene la identidad legal y datos de contacto del organizer
 */
export interface BillingProfile {
  id: string
  user_id: string
  entity_type: EntityType
  full_name: string
  document_type: BackendDocumentType
  document_number: string
  tax_id?: string | null // NIT (obligatorio si entity_type = legal)
  fiscal_address: string
  contact_email: string
  contact_phone: string
  created_at?: string
  updated_at?: string
}

/**
 * Cuenta Bancaria (bank_accounts)
 * Un usuario puede tener múltiples cuentas pero solo una activa
 */
export interface BankAccount {
  id: string
  user_id: string
  holder_name: string
  bank_name: string
  account_type: AccountType
  account_number: string
  status: VerificationStatus
  is_active: boolean
  rejection_reason?: string | null // Obligatorio si status = rejected
  created_at?: string
  updated_at?: string
}

/**
 * Documento de Facturación (billing_documents)
 * Referencia a archivos almacenados en Supabase Storage
 */
export interface BillingDocument {
  id: string
  user_id: string
  document_type: BillingDocumentType
  document_name: string
  storage_bucket: string
  storage_path: string
  created_at?: string
}

// ============================================================
// DTOs para crear/actualizar
// ============================================================

/** DTO para crear perfil de facturación */
export interface CreateBillingProfileDTO {
  user_id: string
  entity_type: EntityType
  full_name: string
  document_type: BackendDocumentType
  document_number: string
  tax_id?: string // Obligatorio si entity_type = legal
  fiscal_address: string
  contact_email: string
  contact_phone: string
}

/** DTO para actualizar perfil de facturación */
export interface UpdateBillingProfileDTO {
  full_name?: string
  document_type?: BackendDocumentType
  document_number?: string
  tax_id?: string
  fiscal_address?: string
  contact_email?: string
  contact_phone?: string
}

/** DTO para crear cuenta bancaria */
export interface CreateBankAccountDTO {
  user_id: string
  holder_name: string
  bank_name: string
  account_type: AccountType
  account_number: string
}

/** DTO para actualizar cuenta bancaria */
export interface UpdateBankAccountDTO {
  holder_name?: string
  bank_name?: string
  account_type?: AccountType
  account_number?: string
  is_active?: boolean
}

/** DTO para crear referencia de documento */
export interface CreateBillingDocumentDTO {
  user_id: string
  document_type: BillingDocumentType
  document_name: string
  storage_bucket: string
  storage_path: string
}

// ============================================================
// Respuestas de elegibilidad
// ============================================================

/** Respuesta del RPC check_organizer_payment_eligibility */
export interface PaymentEligibilityResponse {
  eligible: boolean
  message: string
}

// ============================================================
// Tipos compuestos para la UI
// ============================================================

/**
 * Datos completos de billing para la UI
 * Combina perfil, cuentas y documentos
 */
export interface BillingData {
  profile: BillingProfile | null
  accounts: BankAccount[]
  activeAccount: BankAccount | null
  documents: BillingDocument[]
  eligibility: PaymentEligibilityResponse | null
}

/**
 * Modelo legacy de configuración de facturación (para compatibilidad con UI existente)
 * @deprecated Usar BillingData en su lugar
 */
export interface BillingSettings {
  id?: string
  organizerId: string
  
  // Tipo de entidad (inmutable después de primer guardado)
  entityType: EntityType | null
  entityTypeLocked: boolean // true si existe billing_profile
  
  // Información legal (condicional según entityType)
  naturalPersonInfo?: NaturalPersonLegalInfo
  legalEntityInfo?: LegalEntityLegalInfo
  
  // Datos de contacto
  contactInfo?: ContactInfo
  
  // Información bancaria (cuenta activa)
  bankInfo?: BankInfo
  
  // Estado de verificación
  verificationStatus: VerificationStatus | null
  
  // Auditoría
  createdAt?: string
  updatedAt?: string
}

/** Información legal para Persona Natural (legacy) */
export interface NaturalPersonLegalInfo {
  fullName: string
  documentType: DocumentType
  documentNumber: string
  fiscalAddress: string
  idDocumentUrl?: string
}

/** Información legal para Persona Jurídica (legacy) */
export interface LegalEntityLegalInfo {
  businessName: string
  nit: string
  fiscalAddress: string
  rutDocumentUrl?: string
}

/** Datos de contacto financiero (legacy) */
export interface ContactInfo {
  email: string
  phone: string
  address: string
}

/** Información bancaria (legacy) */
export interface BankInfo {
  accountHolder: string
  bankOrProvider: string
  accountType: AccountType
  accountNumber: string
  bankCertificateUrl?: string
}

// ============================================================
// Respuestas de API
// ============================================================

/** Respuesta del API al obtener configuración */
export interface BillingSettingsResponse {
  success: boolean
  data?: BillingSettings
  error?: string
}

/** Respuesta del API al guardar configuración */
export interface SaveBillingResponse {
  success: boolean
  data?: BillingSettings
  error?: string
  message?: string
}

/** Respuesta del API para datos completos */
export interface BillingDataResponse {
  success: boolean
  data?: BillingData
  error?: string
}

// ============================================================
// Input para formularios
// ============================================================

/** DTO para crear/actualizar configuración de facturación desde UI */
export interface BillingSettingsInput {
  entityType: EntityType
  
  // Info legal según tipo de entidad
  naturalPersonInfo?: Omit<NaturalPersonLegalInfo, "idDocumentUrl">
  legalEntityInfo?: Omit<LegalEntityLegalInfo, "rutDocumentUrl">
  
  // Contacto
  contactInfo: ContactInfo
  
  // Banco
  bankInfo: Omit<BankInfo, "bankCertificateUrl">
  
  // Archivos
  idDocumentFileName?: string
  rutDocumentFileName?: string
  bankCertificateFileName?: string
}

// ============================================================
// Constantes y configuración
// ============================================================

/** Bancos disponibles en Colombia */
export const COLOMBIAN_BANKS = [
  { id: "Bancolombia", name: "Bancolombia" },
  { id: "Davivienda", name: "Davivienda" },
  { id: "BBVA Colombia", name: "BBVA Colombia" },
  { id: "Banco de Bogotá", name: "Banco de Bogotá" },
  { id: "Banco de Occidente", name: "Banco de Occidente" },
  { id: "Banco Popular", name: "Banco Popular" },
  { id: "Scotiabank Colpatria", name: "Scotiabank Colpatria" },
  { id: "Banco Agrario", name: "Banco Agrario" },
  { id: "AV Villas", name: "AV Villas" },
  { id: "Banco Caja Social", name: "Banco Caja Social" },
  { id: "Itaú", name: "Itaú" },
  { id: "GNB Sudameris", name: "GNB Sudameris" },
  { id: "Banco Pichincha", name: "Banco Pichincha" },
  { id: "Bancoomeva", name: "Bancoomeva" },
  { id: "Banco Falabella", name: "Banco Falabella" },
  { id: "Nequi", name: "Nequi (Billetera Digital)" },
  { id: "Daviplata", name: "Daviplata (Billetera Digital)" },
  { id: "Dale", name: "Dale (Billetera Digital)" },
] as const

/** Tipos de cuenta con labels */
export const ACCOUNT_TYPES = [
  { id: "savings" as AccountType, name: "Cuenta de Ahorros" },
  { id: "checking" as AccountType, name: "Cuenta Corriente" },
  { id: "wallet" as AccountType, name: "Billetera Digital" },
] as const

/** Tipos de documento con labels (UI) */
export const DOCUMENT_TYPES = [
  { id: "cedula_ciudadania" as DocumentType, name: "Cédula de Ciudadanía", backend: "CC" as BackendDocumentType },
  { id: "cedula_extranjeria" as DocumentType, name: "Cédula de Extranjería", backend: "CE" as BackendDocumentType },
  { id: "passport" as DocumentType, name: "Pasaporte", backend: "PASSPORT" as BackendDocumentType },
] as const

/** Estados de verificación con labels y colores */
export const VERIFICATION_STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "yellow",
    message: "La cuenta bancaria se encuentra en proceso de verificación. Mientras este proceso no finalice, no se podrán realizar transferencias.",
  },
  verified: {
    label: "Verificada",
    color: "green",
    message: "La cuenta bancaria ha sido verificada. Puedes recibir transferencias.",
  },
  rejected: {
    label: "Rechazada",
    color: "red",
    message: "La verificación de la cuenta bancaria falló. Por favor, corrige la información y vuelve a intentarlo.",
  },
} as const

/** Formatos de archivo permitidos */
export const ALLOWED_FILE_FORMATS = {
  idDocument: ["pdf", "jpg", "jpeg", "png"],
  rut: ["pdf"],
  bankCertificate: ["pdf", "jpg", "jpeg", "png"],
} as const

/** Bucket de Storage para documentos de billing */
export const BILLING_DOCUMENTS_BUCKET = "billing-documents"

// ============================================================
// Helpers de conversión
// ============================================================

/** Convierte DocumentType de UI a BackendDocumentType */
export function toBackendDocumentType(uiType: DocumentType): BackendDocumentType {
  const mapping: Record<DocumentType, BackendDocumentType> = {
    cedula_ciudadania: "CC",
    cedula_extranjeria: "CE",
    passport: "PASSPORT",
  }
  return mapping[uiType]
}

/** Convierte BackendDocumentType a DocumentType de UI */
export function toUIDocumentType(backendType: BackendDocumentType): DocumentType {
  const mapping: Record<BackendDocumentType, DocumentType> = {
    CC: "cedula_ciudadania",
    CE: "cedula_extranjeria",
    PASSPORT: "passport",
  }
  return mapping[backendType]
}

/** 
 * Convierte BillingData del backend a BillingSettings legacy para UI
 */
export function toBillingSettings(data: BillingData, organizerId: string): BillingSettings {
  const profile = data.profile
  const activeAccount = data.activeAccount
  const documents = data.documents

  if (!profile) {
    return {
      organizerId,
      entityType: null,
      entityTypeLocked: false,
      verificationStatus: null,
    }
  }

  const idDocument = documents.find(d => d.document_type === "id_document")
  const rutDocument = documents.find(d => d.document_type === "rut")
  const bankCertificate = documents.find(d => d.document_type === "bank_certificate")

  const settings: BillingSettings = {
    id: profile.id,
    organizerId,
    entityType: profile.entity_type,
    entityTypeLocked: true, // Si existe profile, está bloqueado
    contactInfo: {
      email: profile.contact_email,
      phone: profile.contact_phone,
      address: profile.fiscal_address,
    },
    verificationStatus: activeAccount?.status || null,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }

  // Info legal según tipo
  if (profile.entity_type === "natural") {
    settings.naturalPersonInfo = {
      fullName: profile.full_name,
      documentType: toUIDocumentType(profile.document_type),
      documentNumber: profile.document_number,
      fiscalAddress: profile.fiscal_address,
      idDocumentUrl: idDocument?.storage_path,
    }
  } else {
    settings.legalEntityInfo = {
      businessName: profile.full_name,
      nit: profile.tax_id || "",
      fiscalAddress: profile.fiscal_address,
      rutDocumentUrl: rutDocument?.storage_path,
    }
  }

  // Info bancaria de cuenta activa
  if (activeAccount) {
    settings.bankInfo = {
      accountHolder: activeAccount.holder_name,
      bankOrProvider: activeAccount.bank_name,
      accountType: activeAccount.account_type,
      accountNumber: activeAccount.account_number,
      bankCertificateUrl: bankCertificate?.storage_path,
    }
  }

  return settings
}
