/**
 * Funciones para cargar y guardar datos mock de facturación
 * 
 * Estas funciones simulan las respuestas del backend durante el desarrollo.
 * Los datos se mantienen en memoria durante la sesión del servidor.
 * Serán reemplazadas por llamadas HTTP reales en el futuro.
 */

import type {
  BillingSettings,
  BillingSettingsInput,
  VerificationStatus,
} from "@/lib/types/billing/types"

// Store en memoria para simular persistencia durante la sesión
let billingSettingsStore: Map<string, BillingSettings> = new Map()

/**
 * Carga la configuración de facturación de un organizador
 */
export function loadBillingSettings(organizerId: string): BillingSettings | null {
  const settings = billingSettingsStore.get(organizerId)
  
  if (!settings) {
    // Retornar configuración vacía inicial
    return {
      organizerId,
      entityType: null,
      entityTypeLocked: false,
      verificationStatus: null,
    }
  }
  
  return settings
}

/**
 * Guarda la configuración de facturación de un organizador
 */
export function saveBillingSettings(
  organizerId: string,
  input: BillingSettingsInput,
  existingSettings?: BillingSettings | null
): BillingSettings {
  const now = new Date().toISOString()
  
  // Determinar si el tipo de entidad debe bloquearse
  const isFirstSave = !existingSettings || !existingSettings.entityTypeLocked
  const entityTypeLocked = true // Se bloquea después del primer guardado
  
  // Determinar si los datos bancarios cambiaron
  const bankInfoChanged = existingSettings?.bankInfo && (
    existingSettings.bankInfo.accountNumber !== input.bankInfo.accountNumber ||
    existingSettings.bankInfo.bankOrProvider !== input.bankInfo.bankOrProvider ||
    existingSettings.bankInfo.accountType !== input.bankInfo.accountType ||
    existingSettings.bankInfo.accountHolder !== input.bankInfo.accountHolder
  )
  
  // Si cambiaron datos bancarios, resetear verificación a pendiente (RN-06)
  let verificationStatus: VerificationStatus = "pending"
  if (!bankInfoChanged && existingSettings?.verificationStatus) {
    verificationStatus = existingSettings.verificationStatus
  }
  
  const settings: BillingSettings = {
    id: existingSettings?.id || `billing_${organizerId}_${Date.now()}`,
    organizerId,
    entityType: input.entityType,
    entityTypeLocked,
    verificationStatus,
    createdAt: existingSettings?.createdAt || now,
    updatedAt: now,
  }
  
  // Agregar información según tipo de entidad
  if (input.entityType === "natural" && input.naturalPersonInfo) {
    settings.naturalPersonInfo = {
      ...input.naturalPersonInfo,
      idDocumentUrl: input.idDocumentFileName || existingSettings?.naturalPersonInfo?.idDocumentUrl,
    }
  } else if (input.entityType === "legal" && input.legalEntityInfo) {
    settings.legalEntityInfo = {
      ...input.legalEntityInfo,
      rutDocumentUrl: input.rutDocumentFileName || existingSettings?.legalEntityInfo?.rutDocumentUrl,
    }
  }
  
  // Agregar información de contacto
  settings.contactInfo = input.contactInfo
  
  // Agregar información bancaria
  settings.bankInfo = {
    ...input.bankInfo,
    bankCertificateUrl: input.bankCertificateFileName || existingSettings?.bankInfo?.bankCertificateUrl,
  }
  
  // Guardar en el store
  billingSettingsStore.set(organizerId, settings)
  
  return settings
}

/**
 * Verifica si el tipo de entidad está bloqueado para un organizador
 */
export function isEntityTypeLocked(organizerId: string): boolean {
  const settings = billingSettingsStore.get(organizerId)
  return settings?.entityTypeLocked ?? false
}

/**
 * Resetea los datos mock (útil para testing)
 */
export function resetBillingMocks(): void {
  billingSettingsStore = new Map()
}

/**
 * Simula la actualización del estado de verificación (para testing)
 */
export function updateVerificationStatus(
  organizerId: string,
  status: VerificationStatus
): BillingSettings | null {
  const settings = billingSettingsStore.get(organizerId)
  
  if (!settings) {
    return null
  }
  
  const updatedSettings: BillingSettings = {
    ...settings,
    verificationStatus: status,
    updatedAt: new Date().toISOString(),
  }
  
  billingSettingsStore.set(organizerId, updatedSettings)
  
  return updatedSettings
}

