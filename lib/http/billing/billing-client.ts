/**
 * Cliente HTTP para billing (billing_profiles, bank_accounts, billing_documents)
 * Comunicación con el backend de Supabase via REST API
 */

import { HttpClient, HttpError, NetworkError } from "../client"
import type {
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
  BackendArrayResponse,
  BackendCreateResponse,
  BackendUpdateResponse,
} from "./types"

// Configuración desde variables de entorno
function getBackendConfig() {
  const apiUrl = process.env.BACKEND_API_URL
  const apiKey = process.env.BACKEND_API_KEY
  const dbSchema = process.env.BACKEND_DB_SCHEMA

  if (!apiUrl || !apiKey || !dbSchema) {
    console.error("❌ [BILLING CLIENT] Missing environment variables:")
    console.error("  - BACKEND_API_URL:", !!apiUrl)
    console.error("  - BACKEND_API_KEY:", !!apiKey)
    console.error("  - BACKEND_DB_SCHEMA:", !!dbSchema)
    throw new Error("Missing backend configuration. Check environment variables.")
  }

  return { apiUrl, apiKey, dbSchema }
}

/**
 * Cliente de billing singleton
 */
class BillingClient {
  private client: HttpClient
  private apiKey: string
  private dbSchema: string

  constructor() {
    const config = getBackendConfig()
    
    this.apiKey = config.apiKey
    this.dbSchema = config.dbSchema
    
    this.client = new HttpClient({
      baseUrl: config.apiUrl,
      timeout: 10000,
    })
  }

  /**
   * Headers para peticiones GET
   */
  private getReadHeaders(): Record<string, string> {
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
      "Accept-Profile": this.dbSchema,
    }
  }

  /**
   * Headers para peticiones POST/PUT/PATCH
   */
  private getWriteHeaders(): Record<string, string> {
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Profile": this.dbSchema,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }
  }

  // ============================================================
  // BILLING PROFILES
  // ============================================================

  /**
   * Obtiene el perfil de facturación de un usuario
   * @param userId - ID del usuario
   * @returns Perfil de facturación o null si no existe
   */
  async getBillingProfile(userId: string): Promise<BillingProfile | null> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting billing profile for user: ${userId}`)
      
      const response = await this.client.get<BackendArrayResponse<BillingProfile>>(
        "/billing_profiles",
        {
          params: { user_id: `eq.${userId}` },
          headers: this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [BILLING CLIENT] No billing profile found for user: ${userId}`)
        return null
      }

      console.log(`✅ [BILLING CLIENT] Billing profile found for user: ${userId}`)
      return response[0]
    } catch (error) {
      this.handleError("getBillingProfile", error)
      throw error
    }
  }

  /**
   * Crea un perfil de facturación
   * @param data - Datos del perfil a crear
   * @returns Perfil creado
   */
  async createBillingProfile(data: CreateBillingProfileDTO): Promise<BillingProfile> {
    try {
      console.log(`📝 [BILLING CLIENT] Creating billing profile for user: ${data.user_id}`)
      
      const response = await this.client.post<BackendCreateResponse<BillingProfile>>(
        "/billing_profiles",
        data,
        { headers: this.getWriteHeaders() }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when creating billing profile")
      }

      console.log(`✅ [BILLING CLIENT] Billing profile created for user: ${data.user_id}`)
      return response[0]
    } catch (error) {
      this.handleError("createBillingProfile", error)
      throw error
    }
  }

  /**
   * Actualiza un perfil de facturación
   * @param userId - ID del usuario
   * @param data - Datos a actualizar
   * @returns Perfil actualizado
   */
  async updateBillingProfile(userId: string, data: UpdateBillingProfileDTO): Promise<BillingProfile> {
    try {
      console.log(`📝 [BILLING CLIENT] Updating billing profile for user: ${userId}`)
      
      const response = await this.client.patch<BackendUpdateResponse<BillingProfile>>(
        "/billing_profiles",
        data,
        {
          params: { user_id: `eq.${userId}` },
          headers: this.getWriteHeaders(),
        }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when updating billing profile")
      }

      console.log(`✅ [BILLING CLIENT] Billing profile updated for user: ${userId}`)
      return response[0]
    } catch (error) {
      this.handleError("updateBillingProfile", error)
      throw error
    }
  }

  // ============================================================
  // BANK ACCOUNTS
  // ============================================================

  /**
   * Obtiene todas las cuentas bancarias de un usuario
   * @param userId - ID del usuario
   * @returns Lista de cuentas bancarias
   */
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting bank accounts for user: ${userId}`)
      
      const response = await this.client.get<BackendArrayResponse<BankAccount>>(
        "/bank_accounts",
        {
          params: {
            user_id: `eq.${userId}`,
            order: "created_at.desc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [BILLING CLIENT] Found ${response?.length || 0} bank accounts for user: ${userId}`)
      return response || []
    } catch (error) {
      this.handleError("getBankAccounts", error)
      throw error
    }
  }

  /**
   * Obtiene la cuenta bancaria preferida de un usuario (para recibir pagos)
   * @param userId - ID del usuario
   * @returns Cuenta preferida o null si no hay ninguna preferida
   */
  async getPreferredBankAccount(userId: string): Promise<BankAccount | null> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting preferred bank account for user: ${userId}`)
      
      const response = await this.client.get<BackendArrayResponse<BankAccount>>(
        "/bank_accounts",
        {
          params: {
            user_id: `eq.${userId}`,
            is_preferred: "eq.true",
          },
          headers: this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [BILLING CLIENT] No preferred bank account found for user: ${userId}`)
        return null
      }

      console.log(`✅ [BILLING CLIENT] Preferred bank account found for user: ${userId}`)
      return response[0]
    } catch (error) {
      this.handleError("getPreferredBankAccount", error)
      throw error
    }
  }

  /**
   * Obtiene las cuentas bancarias activas de un usuario
   * @param userId - ID del usuario
   * @returns Lista de cuentas activas
   */
  async getActiveBankAccounts(userId: string): Promise<BankAccount[]> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting active bank accounts for user: ${userId}`)
      
      const response = await this.client.get<BackendArrayResponse<BankAccount>>(
        "/bank_accounts",
        {
          params: {
            user_id: `eq.${userId}`,
            is_active: "eq.true",
            order: "created_at.desc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [BILLING CLIENT] Found ${response?.length || 0} active bank accounts for user: ${userId}`)
      return response || []
    } catch (error) {
      this.handleError("getActiveBankAccounts", error)
      throw error
    }
  }

  /**
   * @deprecated Use getPreferredBankAccount instead
   * Obtiene la cuenta bancaria activa de un usuario
   * @param userId - ID del usuario
   * @returns Cuenta activa o null si no hay ninguna activa
   */
  async getActiveBankAccount(userId: string): Promise<BankAccount | null> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting active bank account for user: ${userId}`)
      
      const response = await this.client.get<BackendArrayResponse<BankAccount>>(
        "/bank_accounts",
        {
          params: {
            user_id: `eq.${userId}`,
            is_active: "eq.true",
          },
          headers: this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [BILLING CLIENT] No active bank account found for user: ${userId}`)
        return null
      }

      console.log(`✅ [BILLING CLIENT] Active bank account found for user: ${userId}`)
      return response[0]
    } catch (error) {
      this.handleError("getActiveBankAccount", error)
      throw error
    }
  }

  /**
   * Obtiene una cuenta bancaria por ID
   * @param accountId - ID de la cuenta
   * @returns Cuenta bancaria o null si no existe
   */
  async getBankAccountById(accountId: string): Promise<BankAccount | null> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting bank account: ${accountId}`)
      
      const response = await this.client.get<BackendArrayResponse<BankAccount>>(
        "/bank_accounts",
        {
          params: { id: `eq.${accountId}` },
          headers: this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [BILLING CLIENT] Bank account not found: ${accountId}`)
        return null
      }

      console.log(`✅ [BILLING CLIENT] Bank account found: ${accountId}`)
      return response[0]
    } catch (error) {
      this.handleError("getBankAccountById", error)
      throw error
    }
  }

  /**
   * Crea una cuenta bancaria
   * @param data - Datos de la cuenta a crear
   * @returns Cuenta creada
   */
  async createBankAccount(data: CreateBankAccountDTO): Promise<BankAccount> {
    try {
      console.log(`📝 [BILLING CLIENT] Creating bank account for user: ${data.user_id}`)
      
      const response = await this.client.post<BackendCreateResponse<BankAccount>>(
        "/bank_accounts",
        data,
        { headers: this.getWriteHeaders() }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when creating bank account")
      }

      console.log(`✅ [BILLING CLIENT] Bank account created for user: ${data.user_id}`)
      return response[0]
    } catch (error) {
      this.handleError("createBankAccount", error)
      throw error
    }
  }

  /**
   * Actualiza una cuenta bancaria
   * @param accountId - ID de la cuenta
   * @param data - Datos a actualizar
   * @returns Cuenta actualizada
   */
  async updateBankAccount(accountId: string, data: UpdateBankAccountDTO): Promise<BankAccount> {
    try {
      console.log(`📝 [BILLING CLIENT] Updating bank account: ${accountId}`)
      
      const response = await this.client.patch<BackendUpdateResponse<BankAccount>>(
        "/bank_accounts",
        data,
        {
          params: { id: `eq.${accountId}` },
          headers: this.getWriteHeaders(),
        }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when updating bank account")
      }

      console.log(`✅ [BILLING CLIENT] Bank account updated: ${accountId}`)
      return response[0]
    } catch (error) {
      this.handleError("updateBankAccount", error)
      throw error
    }
  }

  /**
   * Activa/reactiva una cuenta bancaria
   * @param accountId - ID de la cuenta a activar
   * @returns Cuenta activada
   */
  async activateBankAccount(accountId: string): Promise<BankAccount> {
    console.log(`📝 [BILLING CLIENT] Activating bank account: ${accountId}`)
    return this.updateBankAccount(accountId, { is_active: true })
  }

  /**
   * Desactiva/inactiva una cuenta bancaria
   * NOTA: No se puede inactivar una cuenta preferida (is_preferred=true)
   * @param accountId - ID de la cuenta a desactivar
   * @returns Cuenta desactivada
   */
  async deactivateBankAccount(accountId: string): Promise<BankAccount> {
    console.log(`📝 [BILLING CLIENT] Deactivating bank account: ${accountId}`)
    return this.updateBankAccount(accountId, { is_active: false })
  }

  /**
   * Marca una cuenta bancaria como preferida (para recibir pagos)
   * NOTA: Requiere is_active=true AND status=verified
   * Al marcar una cuenta como preferida, la anterior se desmarca automáticamente
   * @param accountId - ID de la cuenta a marcar como preferida
   * @returns Cuenta actualizada
   */
  async setPreferredBankAccount(accountId: string): Promise<BankAccount> {
    console.log(`📝 [BILLING CLIENT] Setting preferred bank account: ${accountId}`)
    return this.updateBankAccount(accountId, { is_preferred: true })
  }

  /**
   * Desmarca una cuenta bancaria como preferida
   * @param accountId - ID de la cuenta a desmarcar
   * @returns Cuenta actualizada
   */
  async unsetPreferredBankAccount(accountId: string): Promise<BankAccount> {
    console.log(`📝 [BILLING CLIENT] Unsetting preferred bank account: ${accountId}`)
    return this.updateBankAccount(accountId, { is_preferred: false })
  }

  // ============================================================
  // BILLING DOCUMENTS
  // ============================================================

  /**
   * Obtiene todos los documentos de facturación de un usuario
   * @param userId - ID del usuario
   * @returns Lista de documentos
   */
  async getBillingDocuments(userId: string): Promise<BillingDocument[]> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting billing documents for user: ${userId}`)
      
      const response = await this.client.get<BackendArrayResponse<BillingDocument>>(
        "/billing_documents",
        {
          params: {
            user_id: `eq.${userId}`,
            order: "created_at.desc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [BILLING CLIENT] Found ${response?.length || 0} documents for user: ${userId}`)
      return response || []
    } catch (error) {
      this.handleError("getBillingDocuments", error)
      throw error
    }
  }

  /**
   * Obtiene documentos por tipo
   * @param userId - ID del usuario
   * @param documentType - Tipo de documento
   * @returns Lista de documentos del tipo especificado
   */
  async getBillingDocumentsByType(
    userId: string,
    documentType: "id_document" | "rut" | "bank_certificate"
  ): Promise<BillingDocument[]> {
    try {
      console.log(`🔍 [BILLING CLIENT] Getting ${documentType} documents for user: ${userId}`)
      
      const response = await this.client.get<BackendArrayResponse<BillingDocument>>(
        "/billing_documents",
        {
          params: {
            user_id: `eq.${userId}`,
            document_type: `eq.${documentType}`,
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [BILLING CLIENT] Found ${response?.length || 0} ${documentType} documents`)
      return response || []
    } catch (error) {
      this.handleError("getBillingDocumentsByType", error)
      throw error
    }
  }

  /**
   * Crea una referencia de documento
   * @param data - Datos del documento
   * @returns Documento creado
   */
  async createBillingDocument(data: CreateBillingDocumentDTO): Promise<BillingDocument> {
    try {
      console.log(`📝 [BILLING CLIENT] Creating billing document for user: ${data.user_id}`)
      
      const response = await this.client.post<BackendCreateResponse<BillingDocument>>(
        "/billing_documents",
        data,
        { headers: this.getWriteHeaders() }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when creating billing document")
      }

      console.log(`✅ [BILLING CLIENT] Billing document created: ${data.document_type}`)
      return response[0]
    } catch (error) {
      this.handleError("createBillingDocument", error)
      throw error
    }
  }

  // ============================================================
  // PAYMENT ELIGIBILITY
  // ============================================================

  /**
   * Verifica la elegibilidad de pagos de un organizer
   * @param userId - ID del usuario
   * @returns Estado de elegibilidad
   */
  async checkPaymentEligibility(userId: string): Promise<PaymentEligibilityResponse> {
    try {
      console.log(`🔍 [BILLING CLIENT] Checking payment eligibility for user: ${userId}`)
      
      const response = await this.client.post<PaymentEligibilityResponse>(
        "/rpc/check_organizer_payment_eligibility",
        { p_user_id: userId },
        { headers: this.getWriteHeaders() }
      )

      console.log(`✅ [BILLING CLIENT] Eligibility check complete: ${response?.eligible ? "eligible" : "not eligible"}`)
      return response || { eligible: false, message: "Unknown error" }
    } catch (error) {
      this.handleError("checkPaymentEligibility", error)
      throw error
    }
  }

  // ============================================================
  // COMPOSITE METHODS
  // ============================================================

  /**
   * Obtiene todos los datos de billing de un usuario
   * @param userId - ID del usuario
   * @returns Datos completos de billing
   */
  async getBillingData(userId: string): Promise<BillingData> {
    console.log(`🔍 [BILLING CLIENT] Getting all billing data for user: ${userId}`)

    // Ejecutar consultas en paralelo
    const [profile, accounts, documents] = await Promise.all([
      this.getBillingProfile(userId),
      this.getBankAccounts(userId),
      this.getBillingDocuments(userId),
    ])

    // Encontrar cuenta preferida (para recibir pagos)
    const preferredAccount = accounts.find(a => a.is_preferred) || null
    
    // Encontrar cuenta activa (legacy, para compatibilidad)
    const activeAccount = accounts.find(a => a.is_active) || null

    // Verificar elegibilidad solo si hay perfil
    let eligibility: PaymentEligibilityResponse | null = null
    if (profile) {
      try {
        eligibility = await this.checkPaymentEligibility(userId)
      } catch {
        console.warn(`⚠️ [BILLING CLIENT] Could not check eligibility for user: ${userId}`)
        eligibility = { eligible: false, message: "Could not verify eligibility" }
      }
    }

    console.log(`✅ [BILLING CLIENT] All billing data retrieved for user: ${userId}`)

    return {
      profile,
      accounts,
      activeAccount,
      preferredAccount,
      documents,
      eligibility,
    }
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  private handleError(method: string, error: unknown): void {
    if (error instanceof HttpError) {
      console.error(`❌ [BILLING CLIENT] HTTP Error in ${method}: ${error.status}`)
    } else if (error instanceof NetworkError) {
      console.error(`❌ [BILLING CLIENT] Network Error in ${method}: ${error.message}`)
    } else {
      console.error(`❌ [BILLING CLIENT] Unknown error in ${method}:`, error)
    }
  }
}

// Singleton instance
let billingClientInstance: BillingClient | null = null

/**
 * Obtiene la instancia del cliente de billing
 * Lazy initialization para evitar errores de env vars en build time
 */
export function getBillingClient(): BillingClient {
  if (!billingClientInstance) {
    billingClientInstance = new BillingClient()
  }
  return billingClientInstance
}

// Re-export errors for convenience
export { HttpError, NetworkError } from "../client"

