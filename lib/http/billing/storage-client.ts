/**
 * Cliente HTTP para Supabase Storage
 * Manejo de archivos en el bucket billing-documents
 */

import { NetworkError } from "../client"
import { BILLING_DOCUMENTS_BUCKET, type BillingDocumentType } from "@/lib/types/billing/types"

// Configuración desde variables de entorno
function getStorageConfig() {
  const supabaseUrl = process.env.BACKEND_API_URL
  // Usar service role key para Storage (bypasea RLS)
  // Fallback a BACKEND_API_KEY si no está configurada
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BACKEND_API_KEY

  if (!supabaseUrl || !apiKey) {
    console.error("❌ [STORAGE CLIENT] Missing environment variables:")
    console.error("  - BACKEND_API_URL:", !!supabaseUrl)
    console.error("  - SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.error("  - BACKEND_API_KEY:", !!process.env.BACKEND_API_KEY)
    throw new Error("Missing backend configuration. Check environment variables.")
  }

  // Extraer base URL (quitar /rest/v1 y cualquier path adicional como /schema_name)
  const baseUrl = supabaseUrl.replace(/\/rest\/v1(\/.*)?$/, "")

  return { baseUrl, apiKey }
}

/**
 * Resultado de subida de archivo
 */
export interface UploadResult {
  success: boolean
  path: string
  bucket: string
  fullPath: string
  error?: string
}

/**
 * Información de archivo en Storage
 */
export interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, unknown>
}

/**
 * Cliente de Storage singleton
 */
class StorageClient {
  private baseUrl: string
  private apiKey: string
  private bucket: string

  constructor() {
    const config = getStorageConfig()
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.bucket = BILLING_DOCUMENTS_BUCKET
  }

  /**
   * Construye la ruta del archivo en Storage
   * Formato: {user_id}/{document_type}/{filename}
   */
  private buildPath(userId: string, documentType: BillingDocumentType, filename: string): string {
    // Sanitizar filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
    return `${userId}/${documentType}/${sanitizedFilename}`
  }

  /**
   * Obtiene la URL del endpoint de Storage
   */
  private getStorageUrl(path: string): string {
    return `${this.baseUrl}/storage/v1/object/${this.bucket}/${path}`
  }

  /**
   * Headers para peticiones de Storage
   */
  private getHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
    }
    
    if (contentType) {
      headers["Content-Type"] = contentType
    }
    
    return headers
  }

  /**
   * Determina el Content-Type basado en la extensión del archivo
   */
  private getContentType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    }
    
    return mimeTypes[ext || ""] || "application/octet-stream"
  }

  /**
   * Sube un archivo al Storage
   * @param userId - ID del usuario
   * @param documentType - Tipo de documento
   * @param file - Archivo a subir (Buffer o ArrayBuffer)
   * @param filename - Nombre del archivo
   * @returns Resultado de la subida
   */
  async uploadDocument(
    userId: string,
    documentType: BillingDocumentType,
    file: Buffer | ArrayBuffer,
    filename: string
  ): Promise<UploadResult> {
    const path = this.buildPath(userId, documentType, filename)
    const url = this.getStorageUrl(path)
    const contentType = this.getContentType(filename)

    try {
      console.log(`📤 [STORAGE CLIENT] Uploading ${documentType} for user: ${userId}`)
      console.log(`📤 [STORAGE CLIENT] Path: ${path}`)

      // Convert to Uint8Array for fetch body compatibility
      const body = file instanceof Buffer ? new Uint8Array(file) : new Uint8Array(file)

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(contentType),
        body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [STORAGE CLIENT] Upload failed: ${response.status} - ${errorText}`)
        
        return {
          success: false,
          path,
          bucket: this.bucket,
          fullPath: `${this.bucket}/${path}`,
          error: `Upload failed: ${response.status} - ${errorText}`,
        }
      }

      console.log(`✅ [STORAGE CLIENT] Upload successful: ${path}`)

      return {
        success: true,
        path,
        bucket: this.bucket,
        fullPath: `${this.bucket}/${path}`,
      }
    } catch (error) {
      console.error(`❌ [STORAGE CLIENT] Upload error:`, error)
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        path,
        bucket: this.bucket,
        fullPath: `${this.bucket}/${path}`,
        error: errorMessage,
      }
    }
  }

  /**
   * Actualiza (reemplaza) un archivo existente
   * @param userId - ID del usuario
   * @param documentType - Tipo de documento
   * @param file - Archivo a subir
   * @param filename - Nombre del archivo
   * @returns Resultado de la subida
   */
  async updateDocument(
    userId: string,
    documentType: BillingDocumentType,
    file: Buffer | ArrayBuffer,
    filename: string
  ): Promise<UploadResult> {
    const path = this.buildPath(userId, documentType, filename)
    const url = this.getStorageUrl(path)
    const contentType = this.getContentType(filename)

    try {
      console.log(`📤 [STORAGE CLIENT] Updating ${documentType} for user: ${userId}`)

      // Convert to Uint8Array for fetch body compatibility
      const body = file instanceof Buffer ? new Uint8Array(file) : new Uint8Array(file)

      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(contentType),
        body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [STORAGE CLIENT] Update failed: ${response.status} - ${errorText}`)
        
        return {
          success: false,
          path,
          bucket: this.bucket,
          fullPath: `${this.bucket}/${path}`,
          error: `Update failed: ${response.status} - ${errorText}`,
        }
      }

      console.log(`✅ [STORAGE CLIENT] Update successful: ${path}`)

      return {
        success: true,
        path,
        bucket: this.bucket,
        fullPath: `${this.bucket}/${path}`,
      }
    } catch (error) {
      console.error(`❌ [STORAGE CLIENT] Update error:`, error)
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        path,
        bucket: this.bucket,
        fullPath: `${this.bucket}/${path}`,
        error: errorMessage,
      }
    }
  }

  /**
   * Descarga un archivo del Storage
   * @param path - Ruta completa del archivo en el bucket
   * @returns Buffer con el contenido del archivo
   */
  async downloadDocument(path: string): Promise<Buffer> {
    const url = this.getStorageUrl(path)

    try {
      console.log(`📥 [STORAGE CLIENT] Downloading: ${path}`)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        throw new NetworkError(`Download failed: ${response.status} - ${errorText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      console.log(`✅ [STORAGE CLIENT] Download successful: ${path}`)
      
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error(`❌ [STORAGE CLIENT] Download error:`, error)
      throw error
    }
  }

  /**
   * Genera una URL firmada para acceso temporal al archivo
   * @param path - Ruta del archivo
   * @param expiresIn - Tiempo de expiración en segundos (default: 3600 = 1 hora)
   * @returns URL firmada
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const url = `${this.baseUrl}/storage/v1/object/sign/${this.bucket}/${path}`

    try {
      console.log(`🔗 [STORAGE CLIENT] Generating signed URL for: ${path}`)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...this.getHeaders("application/json"),
        },
        body: JSON.stringify({ expiresIn }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        throw new NetworkError(`Failed to generate signed URL: ${response.status} - ${errorText}`)
      }

      const data = await response.json() as { signedURL: string }
      console.log(`✅ [STORAGE CLIENT] Signed URL generated for: ${path}`)
      
      return `${this.baseUrl}${data.signedURL}`
    } catch (error) {
      console.error(`❌ [STORAGE CLIENT] Signed URL error:`, error)
      throw error
    }
  }

  /**
   * Lista archivos de un usuario
   * @param userId - ID del usuario
   * @returns Lista de archivos
   */
  async listDocuments(userId: string): Promise<StorageFile[]> {
    const url = `${this.baseUrl}/storage/v1/object/list/${this.bucket}`

    try {
      console.log(`📋 [STORAGE CLIENT] Listing documents for user: ${userId}`)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...this.getHeaders("application/json"),
        },
        body: JSON.stringify({
          prefix: `${userId}/`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        throw new NetworkError(`Failed to list documents: ${response.status} - ${errorText}`)
      }

      const files = await response.json() as StorageFile[]
      console.log(`✅ [STORAGE CLIENT] Found ${files.length} files for user: ${userId}`)
      
      return files
    } catch (error) {
      console.error(`❌ [STORAGE CLIENT] List error:`, error)
      throw error
    }
  }

  /**
   * Elimina un archivo del Storage
   * @param path - Ruta del archivo a eliminar
   * @returns true si se eliminó correctamente
   */
  async deleteDocument(path: string): Promise<boolean> {
    const url = this.getStorageUrl(path)

    try {
      console.log(`🗑️ [STORAGE CLIENT] Deleting: ${path}`)

      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [STORAGE CLIENT] Delete failed: ${response.status} - ${errorText}`)
        return false
      }

      console.log(`✅ [STORAGE CLIENT] Delete successful: ${path}`)
      return true
    } catch (error) {
      console.error(`❌ [STORAGE CLIENT] Delete error:`, error)
      return false
    }
  }
}

// Singleton instance
let storageClientInstance: StorageClient | null = null

/**
 * Obtiene la instancia del cliente de Storage
 * Lazy initialization para evitar errores de env vars en build time
 */
export function getStorageClient(): StorageClient {
  if (!storageClientInstance) {
    storageClientInstance = new StorageClient()
  }
  return storageClientInstance
}

