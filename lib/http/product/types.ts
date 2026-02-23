/**
 * Tipos para el cliente HTTP de productos
 * Comunicación con el backend de Supabase
 */

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
} from "@/lib/types/product/types"

/**
 * Respuesta de array del backend (Supabase REST)
 */
export type BackendArrayResponse<T> = T[]

/**
 * Respuesta de creación del backend (Supabase REST con Prefer: return=representation)
 */
export type BackendCreateResponse<T> = T[]

/**
 * Respuesta de actualización del backend
 */
export type BackendUpdateResponse<T> = T[]

/**
 * Re-export de tipos del dominio para conveniencia
 */
export type {
  BackendProduct,
  BackendProductCategory,
  BackendGlamProduct,
  BackendPersonalizationModule,
  BackendProductImage,
  CreateProductDTO,
  UpdateProductDTO,
  CreateProductImageDTO,
  UpdateProductImageDTO,
}
