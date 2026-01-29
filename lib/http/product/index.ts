/**
 * Exports del módulo de cliente HTTP para productos
 */

// Cliente de productos
export { getProductClient, HttpError, NetworkError } from "./product-client"

// Cliente de Storage para imágenes
export { getProductStorageClient, type ImageUploadResult } from "./product-storage-client"

// Tipos
export type {
  BackendProduct,
  BackendProductCategory,
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
