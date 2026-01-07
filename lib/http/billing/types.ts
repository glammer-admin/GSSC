/**
 * Tipos específicos del cliente HTTP de billing
 * Re-exporta tipos del dominio y define tipos de respuesta del backend
 */

// Re-exportar tipos del dominio
export type {
  EntityType,
  BackendDocumentType,
  DocumentType,
  AccountType,
  VerificationStatus,
  BillingDocumentType,
  BillingProfile,
  BankAccount,
  BillingDocument,
  CreateBillingProfileDTO,
  UpdateBillingProfileDTO,
  CreateBankAccountDTO,
  UpdateBankAccountDTO,
  CreateBillingDocumentDTO,
  PaymentEligibilityResponse,
  BillingData,
} from "@/lib/types/billing/types"

/**
 * Respuesta del backend para arrays (GET con filtros)
 */
export type BackendArrayResponse<T> = T[]

/**
 * Respuesta del backend para POST con Prefer: return=representation
 */
export type BackendCreateResponse<T> = T[]

/**
 * Respuesta del backend para PATCH con Prefer: return=representation
 */
export type BackendUpdateResponse<T> = T[]

