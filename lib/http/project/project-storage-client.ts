/**
 * Cliente HTTP para Supabase Storage
 * Manejo de logos de proyectos en el bucket project-logos
 */

import { NetworkError } from "../client"
import { PROJECT_LOGOS_BUCKET } from "@/lib/types/project/types"

// Configuración desde variables de entorno
function getStorageConfig() {
  const supabaseUrl = process.env.BACKEND_API_URL
  // Usar service role key para Storage (bypasea RLS)
  // Fallback a BACKEND_API_KEY si no está configurada
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BACKEND_API_KEY

  if (!supabaseUrl || !apiKey) {
    console.error("❌ [PROJECT STORAGE] Missing environment variables:")
    console.error("  - BACKEND_API_URL:", !!supabaseUrl)
    console.error("  - SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.error("  - BACKEND_API_KEY:", !!process.env.BACKEND_API_KEY)
    throw new Error("Missing backend configuration. Check environment variables.")
  }

  // Extraer base URL (quitar /rest/v1 y cualquier path adicional)
  const baseUrl = supabaseUrl.replace(/\/rest\/v1(\/.*)?$/, "")

  return { baseUrl, apiKey }
}

/**
 * Resultado de subida de logo
 */
export interface LogoUploadResult {
  success: boolean
  path: string
  publicUrl: string
  error?: string
}

/**
 * Cliente de Storage para logos de proyectos
 */
class ProjectStorageClient {
  private baseUrl: string
  private apiKey: string
  private bucket: string

  constructor() {
    const config = getStorageConfig()
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.bucket = PROJECT_LOGOS_BUCKET
  }

  /**
   * Construye la ruta del logo en Storage
   * Formato: {project_id}/logo.{extension}
   */
  private buildPath(projectId: string, extension: string): string {
    return `${projectId}/logo.${extension.toLowerCase()}`
  }

  /**
   * Obtiene la URL del endpoint de Storage
   */
  private getStorageUrl(path: string): string {
    return `${this.baseUrl}/storage/v1/object/${this.bucket}/${path}`
  }

  /**
   * Obtiene la URL pública del logo
   */
  getPublicUrl(projectId: string, extension: string): string {
    const path = this.buildPath(projectId, extension)
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${path}`
  }

  /**
   * Headers para peticiones de Storage
   */
  private getHeaders(contentType?: string, upsert: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
    }
    
    if (contentType) {
      headers["Content-Type"] = contentType
    }
    
    if (upsert) {
      headers["x-upsert"] = "true"
    }
    
    return headers
  }

  /**
   * Determina el Content-Type basado en la extensión del archivo
   */
  private getContentType(extension: string): string {
    const ext = extension.toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      svg: "image/svg+xml",
    }
    
    return mimeTypes[ext] || "application/octet-stream"
  }

  /**
   * Extrae la extensión del nombre de archivo
   */
  private getExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "png"
  }

  /**
   * Sube un logo al Storage
   * @param projectId - ID del proyecto
   * @param file - Archivo a subir (Buffer o ArrayBuffer)
   * @param filename - Nombre del archivo (para obtener extensión)
   * @returns Resultado de la subida
   */
  async uploadLogo(
    projectId: string,
    file: Buffer | ArrayBuffer,
    filename: string
  ): Promise<LogoUploadResult> {
    const extension = this.getExtension(filename)
    const path = this.buildPath(projectId, extension)
    const contentType = this.getContentType(extension)
    const publicUrl = this.getPublicUrl(projectId, extension)

    try {
      console.log(`📤 [PROJECT STORAGE] Uploading logo for project: ${projectId}`)
      console.log(`📤 [PROJECT STORAGE] Path: ${path}`)

      // Convert to Uint8Array for fetch body compatibility
      const body = file instanceof Buffer ? new Uint8Array(file) : new Uint8Array(file)

      const response = await fetch(this.getStorageUrl(path), {
        method: "POST",
        headers: this.getHeaders(contentType, false),
        body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [PROJECT STORAGE] Upload failed: ${response.status} - ${errorText}`)
        
        return {
          success: false,
          path,
          publicUrl,
          error: `Upload failed: ${response.status} - ${errorText}`,
        }
      }

      console.log(`✅ [PROJECT STORAGE] Logo uploaded successfully: ${path}`)

      return {
        success: true,
        path,
        publicUrl,
      }
    } catch (error) {
      console.error(`❌ [PROJECT STORAGE] Upload error:`, error)
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        path,
        publicUrl,
        error: errorMessage,
      }
    }
  }

  /**
   * Actualiza (reemplaza) un logo existente
   * @param projectId - ID del proyecto
   * @param file - Archivo a subir
   * @param filename - Nombre del archivo
   * @returns Resultado de la subida
   */
  async updateLogo(
    projectId: string,
    file: Buffer | ArrayBuffer,
    filename: string
  ): Promise<LogoUploadResult> {
    const extension = this.getExtension(filename)
    const path = this.buildPath(projectId, extension)
    const contentType = this.getContentType(extension)
    const publicUrl = this.getPublicUrl(projectId, extension)

    try {
      console.log(`📤 [PROJECT STORAGE] Updating logo for project: ${projectId}`)
      console.log(`📤 [PROJECT STORAGE] Path: ${path}`)

      const body = file instanceof Buffer ? new Uint8Array(file) : new Uint8Array(file)

      const response = await fetch(this.getStorageUrl(path), {
        method: "POST",
        headers: this.getHeaders(contentType, true), // x-upsert: true
        body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [PROJECT STORAGE] Update failed: ${response.status} - ${errorText}`)
        
        return {
          success: false,
          path,
          publicUrl,
          error: `Update failed: ${response.status} - ${errorText}`,
        }
      }

      console.log(`✅ [PROJECT STORAGE] Logo updated successfully: ${path}`)

      return {
        success: true,
        path,
        publicUrl,
      }
    } catch (error) {
      console.error(`❌ [PROJECT STORAGE] Update error:`, error)
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        path,
        publicUrl,
        error: errorMessage,
      }
    }
  }

  /**
   * Elimina el logo de un proyecto
   * @param projectId - ID del proyecto
   * @param extension - Extensión del archivo
   * @returns true si se eliminó correctamente
   */
  async deleteLogo(projectId: string, extension: string): Promise<boolean> {
    const path = this.buildPath(projectId, extension)

    try {
      console.log(`🗑️ [PROJECT STORAGE] Deleting logo: ${path}`)

      const response = await fetch(this.getStorageUrl(path), {
        method: "DELETE",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [PROJECT STORAGE] Delete failed: ${response.status} - ${errorText}`)
        return false
      }

      console.log(`✅ [PROJECT STORAGE] Logo deleted: ${path}`)
      return true
    } catch (error) {
      console.error(`❌ [PROJECT STORAGE] Delete error:`, error)
      return false
    }
  }

  /**
   * Lista los archivos en la carpeta del proyecto
   * @param projectId - ID del proyecto
   * @returns Lista de archivos
   */
  async listProjectFiles(projectId: string): Promise<string[]> {
    try {
      console.log(`🔍 [PROJECT STORAGE] Listing files for project: ${projectId}`)

      const response = await fetch(`${this.baseUrl}/storage/v1/object/list/${this.bucket}`, {
        method: "POST",
        headers: {
          ...this.getHeaders("application/json"),
        },
        body: JSON.stringify({
          prefix: `${projectId}/`,
          limit: 100,
          offset: 0,
        }),
      })

      if (!response.ok) {
        console.error(`❌ [PROJECT STORAGE] List failed: ${response.status}`)
        return []
      }

      const files = await response.json()
      const fileNames = files.map((f: { name: string }) => f.name)
      
      console.log(`✅ [PROJECT STORAGE] Found ${fileNames.length} files`)
      return fileNames
    } catch (error) {
      console.error(`❌ [PROJECT STORAGE] List error:`, error)
      return []
    }
  }
}

// Singleton instance
let projectStorageClientInstance: ProjectStorageClient | null = null

/**
 * Obtiene la instancia del cliente de Storage para proyectos
 * Lazy initialization para evitar errores de env vars en build time
 */
export function getProjectStorageClient(): ProjectStorageClient {
  if (!projectStorageClientInstance) {
    projectStorageClientInstance = new ProjectStorageClient()
  }
  return projectStorageClientInstance
}

// Re-export NetworkError for convenience
export { NetworkError }
