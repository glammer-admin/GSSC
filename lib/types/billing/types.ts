/**
 * Tipos del dominio de Facturación y Pagos
 * 
 * Basado en spec.md - Configuración de Facturación y Pagos
 */

// Tipo de entidad (RN-01: Solo puede seleccionarse una vez)
export type EntityType = "natural" | "legal"

// Tipo de documento de identidad
export type DocumentType = "cedula_ciudadania" | "cedula_extranjeria"

// Tipo de cuenta bancaria
export type AccountType = "savings" | "checking" | "wallet"

// Estado de verificación de cuenta bancaria
export type VerificationStatus = "pending" | "verified" | "rejected"

/**
 * Información legal para Persona Natural
 */
export interface NaturalPersonLegalInfo {
  fullName: string
  documentType: DocumentType
  documentNumber: string
  fiscalAddress: string
  idDocumentUrl?: string // URL del documento cargado (mock: solo nombre del archivo)
}

/**
 * Información legal para Persona Jurídica
 */
export interface LegalEntityLegalInfo {
  businessName: string // Razón social
  nit: string
  fiscalAddress: string
  rutDocumentUrl?: string // URL del RUT cargado (mock: solo nombre del archivo)
}

/**
 * Datos de contacto financiero
 */
export interface ContactInfo {
  email: string
  phone: string
  address: string
}

/**
 * Información bancaria
 */
export interface BankInfo {
  accountHolder: string // Titular de la cuenta
  bankOrProvider: string // Banco o proveedor de billetera
  accountType: AccountType
  accountNumber: string
  bankCertificateUrl?: string // URL de la certificación bancaria
}

/**
 * Modelo completo de configuración de facturación
 */
export interface BillingSettings {
  id?: string
  organizerId: string
  
  // Tipo de entidad (inmutable después de primer guardado)
  entityType: EntityType | null
  entityTypeLocked: boolean // true después del primer guardado
  
  // Información legal (condicional según entityType)
  naturalPersonInfo?: NaturalPersonLegalInfo
  legalEntityInfo?: LegalEntityLegalInfo
  
  // Datos de contacto
  contactInfo?: ContactInfo
  
  // Información bancaria
  bankInfo?: BankInfo
  
  // Estado de verificación
  verificationStatus: VerificationStatus | null
  
  // Auditoría
  createdAt?: string
  updatedAt?: string
}

/**
 * DTO para crear/actualizar configuración de facturación
 */
export interface BillingSettingsInput {
  entityType: EntityType
  
  // Info legal según tipo de entidad
  naturalPersonInfo?: Omit<NaturalPersonLegalInfo, "idDocumentUrl">
  legalEntityInfo?: Omit<LegalEntityLegalInfo, "rutDocumentUrl">
  
  // Contacto
  contactInfo: ContactInfo
  
  // Banco
  bankInfo: Omit<BankInfo, "bankCertificateUrl">
  
  // Archivos (en esta fase son mock/placeholder)
  idDocumentFileName?: string
  rutDocumentFileName?: string
  bankCertificateFileName?: string
}

/**
 * Respuesta del API al obtener configuración
 */
export interface BillingSettingsResponse {
  success: boolean
  data?: BillingSettings
  error?: string
}

/**
 * Respuesta del API al guardar configuración
 */
export interface SaveBillingResponse {
  success: boolean
  data?: BillingSettings
  error?: string
  message?: string
}

/**
 * Bancos disponibles en Colombia
 */
export const COLOMBIAN_BANKS = [
  { id: "bancolombia", name: "Bancolombia" },
  { id: "davivienda", name: "Davivienda" },
  { id: "bbva", name: "BBVA Colombia" },
  { id: "banco_bogota", name: "Banco de Bogotá" },
  { id: "banco_occidente", name: "Banco de Occidente" },
  { id: "banco_popular", name: "Banco Popular" },
  { id: "scotiabank", name: "Scotiabank Colpatria" },
  { id: "banco_agrario", name: "Banco Agrario" },
  { id: "av_villas", name: "AV Villas" },
  { id: "banco_caja_social", name: "Banco Caja Social" },
  { id: "itau", name: "Itaú" },
  { id: "gnb_sudameris", name: "GNB Sudameris" },
  { id: "banco_pichincha", name: "Banco Pichincha" },
  { id: "bancoomeva", name: "Bancoomeva" },
  { id: "banco_falabella", name: "Banco Falabella" },
  { id: "nequi", name: "Nequi (Billetera Digital)" },
  { id: "daviplata", name: "Daviplata (Billetera Digital)" },
  { id: "dale", name: "Dale (Billetera Digital)" },
] as const

/**
 * Tipos de cuenta con labels
 */
export const ACCOUNT_TYPES = [
  { id: "savings" as AccountType, name: "Cuenta de Ahorros" },
  { id: "checking" as AccountType, name: "Cuenta Corriente" },
  { id: "wallet" as AccountType, name: "Billetera Digital" },
] as const

/**
 * Tipos de documento con labels
 */
export const DOCUMENT_TYPES = [
  { id: "cedula_ciudadania" as DocumentType, name: "Cédula de Ciudadanía" },
  { id: "cedula_extranjeria" as DocumentType, name: "Cédula de Extranjería" },
] as const

/**
 * Estados de verificación con labels y colores
 */
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

/**
 * Formatos de archivo permitidos
 */
export const ALLOWED_FILE_FORMATS = {
  idDocument: ["pdf", "jpg", "jpeg", "png"],
  rut: ["pdf"],
  bankCertificate: ["pdf", "jpg", "jpeg", "png"],
} as const

