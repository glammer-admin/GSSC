/**
 * Cliente HTTP para productos (project_products)
 * Comunicación con el backend de Supabase via REST API
 */

import { HttpClient, HttpError, NetworkError } from "../client"
import type {
  BackendProduct,
  BackendProductCategory,
  BackendGlamProduct,
  BackendPersonalizationModule,
  BackendProductImage,
  CreateProductDTO,
  UpdateProductDTO,
  CreateProductImageDTO,
  UpdateProductImageDTO,
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
    console.error("❌ [PRODUCT CLIENT] Missing environment variables:")
    console.error("  - BACKEND_API_URL:", !!apiUrl)
    console.error("  - BACKEND_API_KEY:", !!apiKey)
    console.error("  - BACKEND_DB_SCHEMA:", !!dbSchema)
    throw new Error("Missing backend configuration. Check environment variables.")
  }

  return { apiUrl, apiKey, dbSchema }
}

/**
 * Cliente de productos singleton
 */
class ProductClient {
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
  // CATEGORÍAS (Solo lectura)
  // ============================================================

  /**
   * Obtiene todas las categorías de productos
   * @returns Lista de categorías
   */
  async getCategories(): Promise<BackendProductCategory[]> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting all categories`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProductCategory>>(
        "/product_categories",
        {
          params: {
            order: "name.asc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [PRODUCT CLIENT] Found ${response?.length || 0} categories`)
      return response || []
    } catch (error) {
      this.handleError("getCategories", error)
      throw error
    }
  }

  /**
   * Obtiene una categoría por código
   * @param code - Código de la categoría
   * @returns Categoría o null si no existe
   */
  async getCategoryByCode(code: string): Promise<BackendProductCategory | null> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting category by code: ${code}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProductCategory>>(
        "/product_categories",
        {
          params: { code: `eq.${code}` },
          headers: this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [PRODUCT CLIENT] Category not found: ${code}`)
        return null
      }

      console.log(`✅ [PRODUCT CLIENT] Category found: ${code}`)
      return response[0]
    } catch (error) {
      this.handleError("getCategoryByCode", error)
      throw error
    }
  }

  /**
   * Obtiene una categoría por ID
   * @param id - ID de la categoría
   * @returns Categoría o null si no existe
   */
  async getCategoryById(id: string): Promise<BackendProductCategory | null> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting category by ID: ${id}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProductCategory>>(
        "/product_categories",
        {
          params: { id: `eq.${id}` },
          headers: this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [PRODUCT CLIENT] Category not found: ${id}`)
        return null
      }

      console.log(`✅ [PRODUCT CLIENT] Category found: ${id}`)
      return response[0]
    } catch (error) {
      this.handleError("getCategoryById", error)
      throw error
    }
  }

  // ============================================================
  // PRODUCTOS DEL CATÁLOGO GLAM URBAN (glam_products, solo lectura)
  // ============================================================

  /**
   * Obtiene los productos del catálogo Glam Urban por categoría
   * @param categoryId - ID de la categoría
   * @returns Lista de productos del catálogo activos
   */
  async getGlamProductsByCategory(categoryId: string): Promise<BackendGlamProduct[]> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting glam products for category: ${categoryId}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendGlamProduct>>(
        "/glam_products",
        {
          params: {
            category_id: `eq.${categoryId}`,
            is_active: "eq.true",
            order: "name.asc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [PRODUCT CLIENT] Found ${response?.length || 0} glam products`)
      return response || []
    } catch (error) {
      this.handleError("getGlamProductsByCategory", error)
      throw error
    }
  }

  /**
   * Obtiene un producto del catálogo Glam Urban por ID
   */
  async getGlamProductById(id: string): Promise<BackendGlamProduct | null> {
    try {
      const response = await this.client.get<BackendArrayResponse<BackendGlamProduct>>(
        "/glam_products",
        {
          params: { id: `eq.${id}` },
          headers: this.getReadHeaders(),
        }
      )
      if (!response || response.length === 0) return null
      return response[0]
    } catch (error) {
      this.handleError("getGlamProductById", error)
      throw error
    }
  }

  // ============================================================
  // MÓDULOS DE PERSONALIZACIÓN (Solo lectura)
  // ============================================================

  /**
   * Obtiene todos los módulos de personalización
   * @returns Lista de módulos
   */
  async getPersonalizationModules(): Promise<BackendPersonalizationModule[]> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting all personalization modules`)
      
      const response = await this.client.get<BackendArrayResponse<BackendPersonalizationModule>>(
        "/personalization_modules",
        {
          params: {
            order: "name.asc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [PRODUCT CLIENT] Found ${response?.length || 0} modules`)
      return response || []
    } catch (error) {
      this.handleError("getPersonalizationModules", error)
      throw error
    }
  }

  // ============================================================
  // CRUD DE PRODUCTOS
  // ============================================================

  /**
   * Obtiene todos los productos de un proyecto
   * @param projectId - ID del proyecto
   * @returns Lista de productos
   */
  async getProductsByProject(projectId: string): Promise<BackendProduct[]> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting products for project: ${projectId}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProduct>>(
        "/project_products",
        {
          params: {
            project_id: `eq.${projectId}`,
            order: "created_at.desc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [PRODUCT CLIENT] Found ${response?.length || 0} products`)
      return response || []
    } catch (error) {
      this.handleError("getProductsByProject", error)
      throw error
    }
  }

  /**
   * Obtiene un producto por ID
   * @param productId - ID del producto
   * @returns Producto o null si no existe
   */
  async getProductById(productId: string): Promise<BackendProduct | null> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting product: ${productId}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProduct>>(
        "/project_products",
        {
          params: { id: `eq.${productId}` },
          headers: this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [PRODUCT CLIENT] Product not found: ${productId}`)
        return null
      }

      console.log(`✅ [PRODUCT CLIENT] Product found: ${productId}`)
      return response[0]
    } catch (error) {
      this.handleError("getProductById", error)
      throw error
    }
  }

  /**
   * Crea un nuevo producto
   * @param data - Datos del producto a crear
   * @returns Producto creado
   */
  async createProduct(data: CreateProductDTO): Promise<BackendProduct> {
    try {
      console.log(`📝 [PRODUCT CLIENT] Creating product: ${data.name}`)
      
      const response = await this.client.post<BackendCreateResponse<BackendProduct>>(
        "/project_products",
        data,
        { headers: this.getWriteHeaders() }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when creating product")
      }

      console.log(`✅ [PRODUCT CLIENT] Product created: ${response[0].id}`)
      return response[0]
    } catch (error) {
      this.handleError("createProduct", error)
      throw error
    }
  }

  /**
   * Actualiza un producto existente
   * @param productId - ID del producto
   * @param data - Datos a actualizar
   * @returns Producto actualizado
   */
  async updateProduct(productId: string, data: UpdateProductDTO): Promise<BackendProduct> {
    try {
      console.log(`📝 [PRODUCT CLIENT] Updating product: ${productId}`)
      
      const response = await this.client.patch<BackendUpdateResponse<BackendProduct>>(
        "/project_products",
        data,
        {
          params: { id: `eq.${productId}` },
          headers: this.getWriteHeaders(),
        }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when updating product")
      }

      console.log(`✅ [PRODUCT CLIENT] Product updated: ${productId}`)
      return response[0]
    } catch (error) {
      this.handleError("updateProduct", error)
      throw error
    }
  }

  // ============================================================
  // IMÁGENES DE PRODUCTOS
  // ============================================================

  /**
   * Obtiene todas las imágenes de un producto
   * @param productId - ID del producto
   * @returns Lista de imágenes ordenadas por posición
   */
  async getProductImages(productId: string): Promise<BackendProductImage[]> {
    try {
      console.log(`🔍 [PRODUCT CLIENT] Getting images for product: ${productId}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProductImage>>(
        "/product_images",
        {
          params: {
            product_id: `eq.${productId}`,
            order: "position.asc",
          },
          headers: this.getReadHeaders(),
        }
      )

      console.log(`✅ [PRODUCT CLIENT] Found ${response?.length || 0} images`)
      return response || []
    } catch (error) {
      this.handleError("getProductImages", error)
      throw error
    }
  }

  /**
   * Crea un registro de imagen de producto
   * @param data - Datos de la imagen
   * @returns Imagen creada
   */
  async createProductImage(data: CreateProductImageDTO): Promise<BackendProductImage> {
    try {
      console.log(`📝 [PRODUCT CLIENT] Creating image for product: ${data.product_id}`)
      
      const response = await this.client.post<BackendCreateResponse<BackendProductImage>>(
        "/product_images",
        data,
        { headers: this.getWriteHeaders() }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when creating image")
      }

      console.log(`✅ [PRODUCT CLIENT] Image created: ${response[0].id}`)
      return response[0]
    } catch (error) {
      this.handleError("createProductImage", error)
      throw error
    }
  }

  /**
   * Actualiza una imagen de producto
   * @param imageId - ID de la imagen
   * @param data - Datos a actualizar
   * @returns Imagen actualizada
   */
  async updateProductImage(imageId: string, data: UpdateProductImageDTO): Promise<BackendProductImage> {
    try {
      console.log(`📝 [PRODUCT CLIENT] Updating image: ${imageId}`)
      
      const response = await this.client.patch<BackendUpdateResponse<BackendProductImage>>(
        "/product_images",
        data,
        {
          params: { id: `eq.${imageId}` },
          headers: this.getWriteHeaders(),
        }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when updating image")
      }

      console.log(`✅ [PRODUCT CLIENT] Image updated: ${imageId}`)
      return response[0]
    } catch (error) {
      this.handleError("updateProductImage", error)
      throw error
    }
  }

  /**
   * Elimina una imagen de producto
   * @param imageId - ID de la imagen
   * @returns true si se eliminó correctamente
   */
  async deleteProductImage(imageId: string): Promise<boolean> {
    try {
      console.log(`🗑️ [PRODUCT CLIENT] Deleting image: ${imageId}`)
      
      await this.client.delete(
        "/product_images",
        {
          params: { id: `eq.${imageId}` },
          headers: this.getWriteHeaders(),
        }
      )

      console.log(`✅ [PRODUCT CLIENT] Image deleted: ${imageId}`)
      return true
    } catch (error) {
      this.handleError("deleteProductImage", error)
      throw error
    }
  }

  /**
   * Obtiene el conteo de imágenes de un producto
   * @param productId - ID del producto
   * @returns Número de imágenes
   */
  async getProductImageCount(productId: string): Promise<number> {
    try {
      const images = await this.getProductImages(productId)
      return images.length
    } catch (error) {
      this.handleError("getProductImageCount", error)
      throw error
    }
  }

  /**
   * Obtiene la siguiente posición disponible para una imagen
   * @param productId - ID del producto
   * @returns Siguiente posición
   */
  async getNextImagePosition(productId: string): Promise<number> {
    try {
      const images = await this.getProductImages(productId)
      if (images.length === 0) return 1
      
      const maxPosition = Math.max(...images.map(img => img.position))
      return maxPosition + 1
    } catch (error) {
      this.handleError("getNextImagePosition", error)
      throw error
    }
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  private handleError(method: string, error: unknown): void {
    if (error instanceof HttpError) {
      console.error(`❌ [PRODUCT CLIENT] HTTP Error in ${method}: ${error.status}`)
      console.error(`❌ [PRODUCT CLIENT] Body:`, error.body)
    } else if (error instanceof NetworkError) {
      console.error(`❌ [PRODUCT CLIENT] Network Error in ${method}: ${error.message}`)
    } else {
      console.error(`❌ [PRODUCT CLIENT] Unknown error in ${method}:`, error)
    }
  }
}

// Singleton instance
let productClientInstance: ProductClient | null = null

/**
 * Obtiene la instancia del cliente de productos
 * Lazy initialization para evitar errores de env vars en build time
 */
export function getProductClient(): ProductClient {
  if (!productClientInstance) {
    productClientInstance = new ProductClient()
  }
  return productClientInstance
}

// Re-export errors for convenience
export { HttpError, NetworkError } from "../client"
