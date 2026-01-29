/**
 * Tipos del dominio de Productos
 * 
 * Basado en spec.md v1.0 - Creación de Productos
 * Alineado con backend Supabase (tablas project_products, product_categories, 
 * personalization_modules, product_images)
 */

// ============================================
// TIPOS BASE (alineados con backend)
// ============================================

/**
 * Estado del producto (RN-06: Estado inicial siempre "draft")
 */
export type ProductStatus = "draft" | "active" | "inactive"

/**
 * Modo de representación visual (RN-04)
 */
export type VisualMode = "upload_images" | "online_editor" | "designer_assisted"

/**
 * Código de módulo de personalización (RN-02)
 */
export type PersonalizationModuleCode = "sizes" | "numbers" | "names" | "age_categories"

/**
 * Origen de imagen de producto (RN-20)
 */
export type ProductImageSource = "upload" | "online_editor" | "designer_assisted"

// ============================================
// CONFIGURACIÓN DE PERSONALIZACIÓN
// ============================================

/**
 * Configuración del módulo de tallas
 */
export interface SizesConfig {
  enabled: boolean
  options: string[]
  price_modifier: number // Siempre 0 en MVP (RN-11)
}

/**
 * Configuración del módulo de números
 */
export interface NumbersConfig {
  enabled: boolean
  min: number
  max: number
  price_modifier: number // Siempre 0 en MVP (RN-11)
}

/**
 * Configuración del módulo de nombres
 */
export interface NamesConfig {
  enabled: boolean
  max_length: number
  price_modifier: number // Siempre 0 en MVP (RN-11)
}

/**
 * Configuración del módulo de categorías de edad
 */
export interface AgeCategoriesConfig {
  enabled: boolean
  options: string[]
  price_modifier: number // Siempre 0 en MVP (RN-11)
}

/**
 * Configuración completa de personalización del producto
 * Inmutable después de activar el producto (RN-13)
 */
export interface PersonalizationConfig {
  sizes?: SizesConfig
  numbers?: NumbersConfig
  names?: NamesConfig
  age_categories?: AgeCategoriesConfig
}

// ============================================
// MODELOS DEL BACKEND
// ============================================

/**
 * Categoría de producto del backend (product_categories)
 * Solo lectura - gestionado por la plataforma
 */
export interface BackendProductCategory {
  id: string
  code: string
  name: string
  description?: string
  allowed_visual_modes: VisualMode[]
  allowed_modules: PersonalizationModuleCode[]
  created_at: string
  updated_at: string
}

/**
 * Módulo de personalización del backend (personalization_modules)
 * Solo lectura - gestionado por la plataforma
 */
export interface BackendPersonalizationModule {
  id: string
  code: PersonalizationModuleCode
  name: string
  description?: string
  created_at: string
  updated_at: string
}

/**
 * Producto del backend (project_products)
 */
export interface BackendProduct {
  id: string
  project_id: string
  category_id: string
  name: string
  description?: string
  status: ProductStatus
  base_price: number
  personalization_config: PersonalizationConfig
  created_at: string
  updated_at: string
}

/**
 * Imagen de producto del backend (product_images)
 */
export interface BackendProductImage {
  id: string
  product_id: string
  url: string
  position: number
  source: ProductImageSource
  created_at: string
  updated_at: string
}

// ============================================
// MODELOS DEL FRONTEND
// ============================================

/**
 * Categoría de producto para el frontend
 */
export interface ProductCategory {
  id: string
  code: string
  name: string
  description?: string
  allowedVisualModes: VisualMode[]
  allowedModules: PersonalizationModuleCode[]
}

/**
 * Módulo de personalización para el frontend
 */
export interface PersonalizationModule {
  id: string
  code: PersonalizationModuleCode
  name: string
  description?: string
}

/**
 * Producto para el frontend (transformado)
 */
export interface Product {
  id: string
  projectId: string
  categoryId: string
  category?: ProductCategory
  name: string
  description?: string
  status: ProductStatus
  basePrice: number
  personalizationConfig: PersonalizationConfig
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

/**
 * Imagen de producto para el frontend
 */
export interface ProductImage {
  id: string
  productId: string
  url: string
  publicUrl: string
  position: number
  source: ProductImageSource
}

// ============================================
// DTOs PARA API
// ============================================

/**
 * DTO para crear producto (POST)
 */
export interface CreateProductDTO {
  project_id: string
  category_id: string
  name: string
  description?: string
  base_price: number
  personalization_config: PersonalizationConfig
  status?: ProductStatus // Default: draft
}

/**
 * DTO para actualizar producto (PATCH)
 * personalization_config solo editable si status es draft (RN-12, RN-13)
 */
export interface UpdateProductDTO {
  name?: string
  description?: string
  base_price?: number
  personalization_config?: PersonalizationConfig // Solo si draft
  status?: ProductStatus
}

/**
 * DTO para crear imagen de producto (POST)
 */
export interface CreateProductImageDTO {
  product_id: string
  url: string
  position: number
  source: ProductImageSource
}

/**
 * DTO para actualizar imagen de producto (PATCH)
 */
export interface UpdateProductImageDTO {
  position?: number
  url?: string
}

/**
 * Input del formulario para crear producto
 */
export interface CreateProductInput {
  categoryId: string
  name: string
  description?: string
  basePrice: number
  personalizationConfig: PersonalizationConfig
}

/**
 * Input del formulario para actualizar producto
 */
export interface UpdateProductInput {
  name?: string
  description?: string
  basePrice?: number
  personalizationConfig?: PersonalizationConfig
  status?: ProductStatus
}

// ============================================
// RESPUESTAS DE API
// ============================================

/**
 * Respuesta del backend (array)
 */
export type BackendArrayResponse<T> = T[]

/**
 * Respuesta del backend al crear (array con un elemento)
 */
export type BackendCreateResponse<T> = T[]

/**
 * Respuesta del backend al actualizar (array con un elemento)
 */
export type BackendUpdateResponse<T> = T[]

/**
 * Respuesta del API al obtener producto
 */
export interface ProductResponse {
  success: boolean
  data?: Product
  error?: string
}

/**
 * Respuesta del API al crear/actualizar producto
 */
export interface SaveProductResponse {
  success: boolean
  data?: Product
  error?: string
  message?: string
}

/**
 * Respuesta del API al listar productos
 */
export interface ProductListResponse {
  success: boolean
  data?: Product[]
  error?: string
}

/**
 * Respuesta del API al listar categorías
 */
export interface CategoryListResponse {
  success: boolean
  data?: ProductCategory[]
  error?: string
}

/**
 * Respuesta del API para imágenes
 */
export interface ImageUploadResponse {
  success: boolean
  data?: ProductImage
  error?: string
}

// ============================================
// CONSTANTES DEL DOMINIO
// ============================================

/**
 * Nombre del bucket de Storage para imágenes de productos
 */
export const PRODUCT_IMAGES_BUCKET = "product-images"

/**
 * Formatos de imagen permitidos (RN-16)
 */
export const ALLOWED_IMAGE_FORMATS = ["png", "jpg", "jpeg", "webp"] as const

/**
 * Tamaño máximo de imagen en bytes (10MB)
 */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Tamaño máximo de imagen en MB para mostrar al usuario
 */
export const MAX_IMAGE_SIZE_MB = 10

/**
 * Mínimo de imágenes para activar producto (RN-16)
 */
export const MIN_IMAGES_FOR_ACTIVATION = 3

/**
 * Longitud máxima del nombre del producto
 */
export const MAX_PRODUCT_NAME_LENGTH = 200

/**
 * Longitud máxima de la descripción
 */
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 1000

/**
 * Estados del producto con labels y colores
 */
export const PRODUCT_STATUS_CONFIG = {
  draft: {
    label: "Borrador",
    color: "gray",
    description: "Producto en configuración, no visible para compradores",
  },
  active: {
    label: "Activo",
    color: "green",
    description: "Producto publicado, visible en tienda",
  },
  inactive: {
    label: "Inactivo",
    color: "red",
    description: "Producto desactivado, no visible para nuevos compradores",
  },
} as const

/**
 * Transiciones de estado válidas (RN-23)
 */
export const VALID_PRODUCT_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ["active"],
  active: ["inactive"],
  inactive: ["active"],
}

/**
 * Modos visuales con labels
 */
export const VISUAL_MODES = [
  { id: "upload_images" as VisualMode, name: "Subir imágenes", description: "Carga manual de imágenes" },
  { id: "online_editor" as VisualMode, name: "Editor Online", description: "Diseña tu producto en el editor" },
  { id: "designer_assisted" as VisualMode, name: "Diseño Asistido", description: "Un diseñador de Glam Urban te ayudará" },
] as const

/**
 * Módulos de personalización con labels
 */
export const PERSONALIZATION_MODULES_CONFIG = {
  sizes: {
    label: "Selección de talla",
    description: "Permite al comprador elegir talla",
  },
  numbers: {
    label: "Número deportivo",
    description: "Permite agregar número en la espalda (1-99)",
  },
  names: {
    label: "Nombre personalizado",
    description: "Permite agregar nombre en la espalda",
  },
  age_categories: {
    label: "Categoría de edad",
    description: "Permite seleccionar categoría (infantil, juvenil, adulto)",
  },
} as const

/**
 * Opciones de talla por defecto
 */
export const DEFAULT_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"] as const

/**
 * Opciones de categoría de edad por defecto
 */
export const DEFAULT_AGE_CATEGORY_OPTIONS = ["infantil", "juvenil", "adulto"] as const

/**
 * Configuración por defecto para módulo de números
 */
export const DEFAULT_NUMBERS_CONFIG = {
  min: 1,
  max: 99,
} as const

/**
 * Configuración por defecto para módulo de nombres
 */
export const DEFAULT_NAMES_CONFIG = {
  max_length: 15,
} as const

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Verifica si una transición de estado es válida (RN-23)
 */
export function isValidProductStatusTransition(
  currentStatus: ProductStatus,
  newStatus: ProductStatus
): boolean {
  if (currentStatus === newStatus) return true
  return VALID_PRODUCT_STATUS_TRANSITIONS[currentStatus].includes(newStatus)
}

/**
 * Obtiene los estados disponibles para transición
 */
export function getAvailableProductStatusTransitions(currentStatus: ProductStatus): ProductStatus[] {
  return VALID_PRODUCT_STATUS_TRANSITIONS[currentStatus]
}

/**
 * Valida el nombre del producto (RN-08)
 */
export function validateProductName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim()
  
  if (!trimmed) {
    return { valid: false, error: "El nombre del producto es obligatorio" }
  }
  
  if (trimmed.length > MAX_PRODUCT_NAME_LENGTH) {
    return { valid: false, error: `El nombre no puede exceder ${MAX_PRODUCT_NAME_LENGTH} caracteres` }
  }
  
  return { valid: true }
}

/**
 * Valida el precio base (RN-09)
 */
export function validateBasePrice(price: number | undefined): { valid: boolean; error?: string } {
  if (price === undefined || price === null) {
    return { valid: false, error: "El precio base es obligatorio" }
  }
  
  if (typeof price !== "number" || isNaN(price)) {
    return { valid: false, error: "El precio base debe ser un número" }
  }
  
  if (price <= 0) {
    return { valid: false, error: "El precio base debe ser mayor a 0" }
  }
  
  return { valid: true }
}

/**
 * Valida que los módulos configurados estén permitidos por la categoría (RN-05)
 */
export function validateModulesForCategory(
  config: PersonalizationConfig,
  allowedModules: PersonalizationModuleCode[]
): { valid: boolean; error?: string } {
  const configuredModules = Object.keys(config) as PersonalizationModuleCode[]
  
  for (const module of configuredModules) {
    const moduleConfig = config[module]
    if (moduleConfig?.enabled && !allowedModules.includes(module)) {
      return {
        valid: false,
        error: `El módulo "${PERSONALIZATION_MODULES_CONFIG[module].label}" no está permitido para esta categoría`,
      }
    }
  }
  
  return { valid: true }
}

/**
 * Valida si el producto puede ser activado (RN-16, RN-18)
 */
export function canActivateProduct(
  product: Partial<Product>,
  imageCount: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!product.name?.trim()) {
    errors.push("El nombre del producto es obligatorio")
  }
  
  if (!product.basePrice || product.basePrice <= 0) {
    errors.push("El precio base debe ser mayor a 0")
  }
  
  if (imageCount < MIN_IMAGES_FOR_ACTIVATION) {
    errors.push(`El producto requiere mínimo ${MIN_IMAGES_FOR_ACTIVATION} imágenes para ser activado`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Verifica si se puede eliminar una imagen (RN-19)
 */
export function canDeleteImage(
  productStatus: ProductStatus,
  currentImageCount: number
): { canDelete: boolean; error?: string } {
  if (productStatus === "active" && currentImageCount <= MIN_IMAGES_FOR_ACTIVATION) {
    return {
      canDelete: false,
      error: `No se puede eliminar. El producto activo requiere mínimo ${MIN_IMAGES_FOR_ACTIVATION} imágenes`,
    }
  }
  
  return { canDelete: true }
}

/**
 * Verifica si el formato de imagen es válido
 */
export function isValidImageFormat(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase()
  if (!extension) return false
  return (ALLOWED_IMAGE_FORMATS as readonly string[]).includes(extension)
}

/**
 * Verifica si el tamaño de imagen es válido
 */
export function isValidImageSize(sizeInBytes: number): boolean {
  return sizeInBytes <= MAX_IMAGE_SIZE_BYTES
}

// ============================================
// FUNCIONES DE TRANSFORMACIÓN
// ============================================

/**
 * Transforma categoría del backend al frontend
 */
export function toProductCategory(backend: BackendProductCategory): ProductCategory {
  return {
    id: backend.id,
    code: backend.code,
    name: backend.name,
    description: backend.description,
    allowedVisualModes: backend.allowed_visual_modes,
    allowedModules: backend.allowed_modules,
  }
}

/**
 * Transforma módulo del backend al frontend
 */
export function toPersonalizationModule(backend: BackendPersonalizationModule): PersonalizationModule {
  return {
    id: backend.id,
    code: backend.code,
    name: backend.name,
    description: backend.description,
  }
}

/**
 * Transforma imagen del backend al frontend
 */
export function toProductImage(backend: BackendProductImage, publicUrl: string): ProductImage {
  return {
    id: backend.id,
    productId: backend.product_id,
    url: backend.url,
    publicUrl,
    position: backend.position,
    source: backend.source,
  }
}

/**
 * Transforma producto del backend al frontend
 */
export function toProduct(
  backend: BackendProduct,
  images: ProductImage[] = [],
  category?: ProductCategory
): Product {
  return {
    id: backend.id,
    projectId: backend.project_id,
    categoryId: backend.category_id,
    category,
    name: backend.name,
    description: backend.description,
    status: backend.status,
    basePrice: backend.base_price,
    personalizationConfig: backend.personalization_config,
    images,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  }
}

/**
 * Transforma input del formulario a DTO para crear
 */
export function toCreateProductDTO(
  input: CreateProductInput,
  projectId: string
): CreateProductDTO {
  return {
    project_id: projectId,
    category_id: input.categoryId,
    name: input.name.trim(),
    description: input.description?.trim(),
    base_price: input.basePrice,
    personalization_config: input.personalizationConfig,
    status: "draft",
  }
}

/**
 * Transforma input del formulario a DTO para actualizar
 */
export function toUpdateProductDTO(input: UpdateProductInput): UpdateProductDTO {
  const dto: UpdateProductDTO = {}
  
  if (input.name !== undefined) {
    dto.name = input.name.trim()
  }
  if (input.description !== undefined) {
    dto.description = input.description?.trim()
  }
  if (input.basePrice !== undefined) {
    dto.base_price = input.basePrice
  }
  if (input.personalizationConfig !== undefined) {
    dto.personalization_config = input.personalizationConfig
  }
  if (input.status !== undefined) {
    dto.status = input.status
  }
  
  return dto
}

/**
 * Crea configuración de personalización vacía
 */
export function createEmptyPersonalizationConfig(): PersonalizationConfig {
  return {}
}

/**
 * Crea configuración por defecto para un módulo
 */
export function createDefaultModuleConfig(
  moduleCode: PersonalizationModuleCode
): SizesConfig | NumbersConfig | NamesConfig | AgeCategoriesConfig {
  switch (moduleCode) {
    case "sizes":
      return {
        enabled: true,
        options: [...DEFAULT_SIZE_OPTIONS],
        price_modifier: 0,
      }
    case "numbers":
      return {
        enabled: true,
        min: DEFAULT_NUMBERS_CONFIG.min,
        max: DEFAULT_NUMBERS_CONFIG.max,
        price_modifier: 0,
      }
    case "names":
      return {
        enabled: true,
        max_length: DEFAULT_NAMES_CONFIG.max_length,
        price_modifier: 0,
      }
    case "age_categories":
      return {
        enabled: true,
        options: [...DEFAULT_AGE_CATEGORY_OPTIONS],
        price_modifier: 0,
      }
  }
}

/**
 * Construye la URL pública de una imagen de producto
 */
export function getProductImagePublicUrl(
  baseUrl: string,
  projectId: string,
  productId: string,
  position: number,
  extension: string
): string {
  return `${baseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${projectId}/${productId}/${position}.${extension}`
}
