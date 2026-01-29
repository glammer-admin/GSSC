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
 * Fila de la vista project_sales_summary (resumen de ventas por proyecto).
 * Solo ventas confirmadas (paid). Fuente: specs/sells/sells-curl-example.md
 */
export interface ProjectSalesSummaryRow {
  project_public_code: string
  project_name: string
  project_status: string
  orders_count: number
  units_sold: number
  organizer_commission_total: number
  currency: string | null
  last_sale_at: string | null
}

/**
 * Re-export de tipos del dominio para conveniencia
 */
export type {
  BackendProject,
  CreateProjectDTO,
  UpdateProjectDTO,
}
