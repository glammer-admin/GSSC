/**
 * Tipos para el cliente HTTP de proyectos
 * Comunicación con el backend de Supabase
 */

import type {
  BackendProject,
  CreateProjectDTO,
  UpdateProjectDTO,
} from "@/lib/types/project/types"

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
  BackendProject,
  CreateProjectDTO,
  UpdateProjectDTO,
}
