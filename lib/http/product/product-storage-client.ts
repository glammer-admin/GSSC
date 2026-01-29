/**
 * Cliente HTTP para Supabase Storage
 * Manejo de imágenes de productos en el bucket product-images
 */

import { NetworkError } from "../client"
import { PRODUCT_IMAGES_BUCKET } from "@/lib/types/product/types"

// Configuración desde variables de entorno
function getStorageConfig() {
  const supabaseUrl = process.env.BACKEND_API_URL
  // Usar service role key para Storage (bypasea RLS)
  // Fallback a BACKEND_API_KEY si no está configurada
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BACKEND_API_KEY

  if (!supabaseUrl || !apiKey) {
    console.error("❌ [PRODUCT STORAGE] Missing environment variables:")
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
 * Resultado de subida de imagen
 */
export interface ImageUploadResult {
  success: boolean
  path: string
  publicUrl: string
  error?: string
}

/**
 * Cliente de Storage para imágenes de productos
 */
class ProductStorageClient {
  private baseUrl: string
  private apiKey: string
  private bucket: string

  constructor() {
    const config = getStorageConfig()
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.bucket = PRODUCT_IMAGES_BUCKET
  }

  /**
   * Construye la ruta de la imagen en Storage
   * Formato: {project_id}/{product_id}/{position}.{extension}
   */
  private buildPath(projectId: string, productId: string, position: number, extension: string): string {
    return `${projectId}/${productId}/${position}.${extension.toLowerCase()}`
  }

  /**
   * Obtiene la URL del endpoint de Storage
   */
  private getStorageUrl(path: string): string {
    return `${this.baseUrl}/storage/v1/object/${this.bucket}/${path}`
  }

  /**
   * Obtiene la URL pública de la imagen
   */
  getPublicUrl(projectId: string, productId: string, position: number, extension: string): string {
    const path = this.buildPath(projectId, productId, position, extension)
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${path}`
  }

  /**
   * Obtiene la URL pública desde un path completo
   */
  getPublicUrlFromPath(path: string): string {
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
   * Sube una imagen al Storage
   * @param projectId - ID del proyecto
   * @param productId - ID del producto
   * @param position - Posición de la imagen
   * @param file - Archivo a subir (Buffer o ArrayBuffer)
   * @param filename - Nombre del archivo (para obtener extensión)
   * @returns Resultado de la subida
   */
  async uploadImage(
    projectId: string,
    productId: string,
    position: number,
    file: Buffer | ArrayBuffer,
    filename: string
  ): Promise<ImageUploadResult> {
    const extension = this.getExtension(filename)
    const path = this.buildPath(projectId, productId, position, extension)
    const contentType = this.getContentType(extension)
    const publicUrl = this.getPublicUrl(projectId, productId, position, extension)

    try {
      console.log(`📤 [PRODUCT STORAGE] Uploading image for product: ${productId}`)
      console.log(`📤 [PRODUCT STORAGE] Path: ${path}`)

      // Convert to Uint8Array for fetch body compatibility
      const body = file instanceof Buffer ? new Uint8Array(file) : new Uint8Array(file)

      const response = await fetch(this.getStorageUrl(path), {
        method: "POST",
        headers: this.getHeaders(contentType, false),
        body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [PRODUCT STORAGE] Upload failed: ${response.status} - ${errorText}`)
        
        return {
          success: false,
          path,
          publicUrl,
          error: `Upload failed: ${response.status} - ${errorText}`,
        }
      }

      console.log(`✅ [PRODUCT STORAGE] Image uploaded successfully: ${path}`)

      return {
        success: true,
        path,
        publicUrl,
      }
    } catch (error) {
      console.error(`❌ [PRODUCT STORAGE] Upload error:`, error)
      
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
   * Actualiza (reemplaza) una imagen existente
   * @param projectId - ID del proyecto
   * @param productId - ID del producto
   * @param position - Posición de la imagen
   * @param file - Archivo a subir
   * @param filename - Nombre del archivo
   * @returns Resultado de la subida
   */
  async updateImage(
    projectId: string,
    productId: string,
    position: number,
    file: Buffer | ArrayBuffer,
    filename: string
  ): Promise<ImageUploadResult> {
    const extension = this.getExtension(filename)
    const path = this.buildPath(projectId, productId, position, extension)
    const contentType = this.getContentType(extension)
    const publicUrl = this.getPublicUrl(projectId, productId, position, extension)

    try {
      console.log(`📤 [PRODUCT STORAGE] Updating image for product: ${productId}`)
      console.log(`📤 [PRODUCT STORAGE] Path: ${path}`)

      const body = file instanceof Buffer ? new Uint8Array(file) : new Uint8Array(file)

      const response = await fetch(this.getStorageUrl(path), {
        method: "POST",
        headers: this.getHeaders(contentType, true), // x-upsert: true
        body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [PRODUCT STORAGE] Update failed: ${response.status} - ${errorText}`)
        
        return {
          success: false,
          path,
          publicUrl,
          error: `Update failed: ${response.status} - ${errorText}`,
        }
      }

      console.log(`✅ [PRODUCT STORAGE] Image updated successfully: ${path}`)

      return {
        success: true,
        path,
        publicUrl,
      }
    } catch (error) {
      console.error(`❌ [PRODUCT STORAGE] Update error:`, error)
      
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
   * Elimina una imagen del Storage
   * @param projectId - ID del proyecto
   * @param productId - ID del producto
   * @param position - Posición de la imagen
   * @param extension - Extensión del archivo
   * @returns true si se eliminó correctamente
   */
  async deleteImage(projectId: string, productId: string, position: number, extension: string): Promise<boolean> {
    const path = this.buildPath(projectId, productId, position, extension)

    try {
      console.log(`🗑️ [PRODUCT STORAGE] Deleting image: ${path}`)

      const response = await fetch(this.getStorageUrl(path), {
        method: "DELETE",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [PRODUCT STORAGE] Delete failed: ${response.status} - ${errorText}`)
        return false
      }

      console.log(`✅ [PRODUCT STORAGE] Image deleted: ${path}`)
      return true
    } catch (error) {
      console.error(`❌ [PRODUCT STORAGE] Delete error:`, error)
      return false
    }
  }

  /**
   * Elimina una imagen por su path completo
   * @param path - Path completo de la imagen
   * @returns true si se eliminó correctamente
   */
  async deleteImageByPath(path: string): Promise<boolean> {
    try {
      console.log(`🗑️ [PRODUCT STORAGE] Deleting image by path: ${path}`)

      const response = await fetch(this.getStorageUrl(path), {
        method: "DELETE",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [PRODUCT STORAGE] Delete failed: ${response.status} - ${errorText}`)
        return false
      }

      console.log(`✅ [PRODUCT STORAGE] Image deleted: ${path}`)
      return true
    } catch (error) {
      console.error(`❌ [PRODUCT STORAGE] Delete error:`, error)
      return false
    }
  }

  /**
   * Lista los archivos de un producto
   * @param projectId - ID del proyecto
   * @param productId - ID del producto
   * @returns Lista de nombres de archivos
   */
  async listProductImages(projectId: string, productId: string): Promise<string[]> {
    try {
      console.log(`🔍 [PRODUCT STORAGE] Listing images for product: ${productId}`)

      const response = await fetch(`${this.baseUrl}/storage/v1/object/list/${this.bucket}`, {
        method: "POST",
        headers: {
          ...this.getHeaders("application/json"),
        },
        body: JSON.stringify({
          prefix: `${projectId}/${productId}/`,
          limit: 100,
          offset: 0,
        }),
      })

      if (!response.ok) {
        console.error(`❌ [PRODUCT STORAGE] List failed: ${response.status}`)
        return []
      }

      const files = await response.json()
      const fileNames = files.map((f: { name: string }) => f.name)
      
      console.log(`✅ [PRODUCT STORAGE] Found ${fileNames.length} images`)
      return fileNames
    } catch (error) {
      console.error(`❌ [PRODUCT STORAGE] List error:`, error)
      return []
    }
  }

  /**
   * Elimina todas las imágenes de un producto
   * @param projectId - ID del proyecto
   * @param productId - ID del producto
   * @returns true si se eliminaron todas correctamente
   */
  async deleteAllProductImages(projectId: string, productId: string): Promise<boolean> {
    try {
      console.log(`🗑️ [PRODUCT STORAGE] Deleting all images for product: ${productId}`)

      const files = await this.listProductImages(projectId, productId)
      
      if (files.length === 0) {
        console.log(`ℹ️ [PRODUCT STORAGE] No images to delete`)
        return true
      }

      const deletePromises = files.map(filename => 
        this.deleteImageByPath(`${projectId}/${productId}/${filename}`)
      )

      const results = await Promise.all(deletePromises)
      const allDeleted = results.every(result => result)

      if (allDeleted) {
        console.log(`✅ [PRODUCT STORAGE] All images deleted for product: ${productId}`)
      } else {
        console.warn(`⚠️ [PRODUCT STORAGE] Some images failed to delete for product: ${productId}`)
      }

      return allDeleted
    } catch (error) {
      console.error(`❌ [PRODUCT STORAGE] Delete all error:`, error)
      return false
    }
  }
}

// Singleton instance
let productStorageClientInstance: ProductStorageClient | null = null

/**
 * Obtiene la instancia del cliente de Storage para productos
 * Lazy initialization para evitar errores de env vars en build time
 */
export function getProductStorageClient(): ProductStorageClient {
  if (!productStorageClientInstance) {
    productStorageClientInstance = new ProductStorageClient()
  }
  return productStorageClientInstance
}

// Re-export NetworkError for convenience
export { NetworkError }
