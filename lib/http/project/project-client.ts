/**
 * Cliente HTTP para proyectos (glam_projects)
 * Comunicación con el backend de Supabase via REST API
 */

import { HttpClient, HttpError, NetworkError } from "../client"
import { getCompleteSession } from "@/lib/auth/session-manager"
import type {
  BackendProject,
  CreateProjectDTO,
  UpdateProjectDTO,
  BackendArrayResponse,
  BackendCreateResponse,
  BackendUpdateResponse,
  ProjectSalesSummaryRow,
} from "./types"
import type {
  Project,
  ProjectStatus,
  ProjectMetrics,
} from "@/lib/types/dashboard/organizer"

// Configuración desde variables de entorno
function getBackendConfig() {
  const apiUrl = process.env.BACKEND_API_URL
  const apiKey = process.env.BACKEND_API_KEY
  const dbSchema = process.env.BACKEND_DB_SCHEMA

  if (!apiUrl || !apiKey || !dbSchema) {
    console.error("❌ [PROJECT CLIENT] Missing environment variables:")
    console.error("  - BACKEND_API_URL:", !!apiUrl)
    console.error("  - BACKEND_API_KEY:", !!apiKey)
    console.error("  - BACKEND_DB_SCHEMA:", !!dbSchema)
    throw new Error("Missing backend configuration. Check environment variables.")
  }

  return { apiUrl, apiKey, dbSchema }
}

/**
 * Cliente de proyectos singleton
 */
class ProjectClient {
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
   * Headers para peticiones GET — usa JWT de Supabase como Bearer (RLS-aware)
   */
  private async getReadHeaders(): Promise<Record<string, string>> {
    const session = await getCompleteSession()
    if (!session?.supabaseAccessToken) {
      throw new Error("No valid session for project client")
    }
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${session.supabaseAccessToken}`,
      "Accept-Profile": this.dbSchema,
    }
  }

  /**
   * Headers para peticiones POST/PUT/PATCH — usa JWT de Supabase como Bearer
   */
  private async getWriteHeaders(): Promise<Record<string, string>> {
    const session = await getCompleteSession()
    if (!session?.supabaseAccessToken) {
      throw new Error("No valid session for project client")
    }
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${session.supabaseAccessToken}`,
      "Content-Profile": this.dbSchema,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }
  }

  // ============================================================
  // RESUMEN DE VENTAS POR PROYECTO (project_sales_summary)
  // ============================================================

  /**
   * Obtiene el resumen de proyectos del organizador con métricas de ventas.
   * Mismo patrón que getProjects(organizerId): apiKey en headers y filtro organizer_id.
   * @param organizerId - ID del organizador (session.userId || session.sub)
   * @returns Lista de filas de project_sales_summary
   */
  async getProjectSalesSummary(organizerId: string): Promise<ProjectSalesSummaryRow[]> {
    try {
      const select =
        "project_public_code,project_name,project_status,orders_count,units_sold,organizer_commission_total,currency,last_sale_at"
      const response = await this.client.get<ProjectSalesSummaryRow[]>(
        "/project_sales_summary",
        {
          params: {
            select,
            order: "last_sale_at.desc.nullslast",
            organizer_id: `eq.${organizerId}`,
          },
          headers: await this.getReadHeaders(),
        }
      )
      console.log(`✅ [PROJECT CLIENT] project_sales_summary: ${response?.length ?? 0} rows`)
      return response ?? []
    } catch (error) {
      this.handleError("getProjectSalesSummary", error)
      throw error
    }
  }

  /**
   * Obtiene el resumen de ventas de un proyecto específico por código público.
   * @param publicCode - Código público del proyecto (formato PRJ-XXXXX)
   * @param organizerId - ID del organizador para validación
   * @returns Fila de project_sales_summary o null si no existe/no es del organizador
   */
  async getProjectSalesSummaryByPublicCode(
    publicCode: string,
    organizerId: string
  ): Promise<ProjectSalesSummaryRow | null> {
    try {
      console.log(`🔍 [PROJECT CLIENT] Getting sales summary for project: ${publicCode}`)
      const select =
        "project_public_code,project_name,project_status,orders_count,units_sold,organizer_commission_total,currency,last_sale_at"
      const response = await this.client.get<ProjectSalesSummaryRow[]>(
        "/project_sales_summary",
        {
          params: {
            select,
            project_public_code: `eq.${publicCode}`,
            organizer_id: `eq.${organizerId}`,
          },
          headers: await this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [PROJECT CLIENT] Sales summary not found for project: ${publicCode}`)
        return null
      }

      console.log(`✅ [PROJECT CLIENT] Sales summary found for project: ${publicCode}`)
      return response[0]
    } catch (error) {
      this.handleError("getProjectSalesSummaryByPublicCode", error)
      throw error
    }
  }

  // ============================================================
  // CRUD DE PROYECTOS
  // ============================================================

  /**
   * Obtiene todos los proyectos de un organizador
   * @param organizerId - ID del organizador
   * @returns Lista de proyectos
   */
  async getProjects(organizerId: string): Promise<BackendProject[]> {
    try {
      console.log(`🔍 [PROJECT CLIENT] Getting projects for organizer: ${organizerId}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProject>>(
        "/glam_projects",
        {
          params: {
            organizer_id: `eq.${organizerId}`,
            order: "created_at.desc",
          },
          headers: await this.getReadHeaders(),
        }
      )

      console.log(`✅ [PROJECT CLIENT] Found ${response?.length || 0} projects`)
      return response || []
    } catch (error) {
      this.handleError("getProjects", error)
      throw error
    }
  }

  /**
   * Obtiene un proyecto por ID
   * @param projectId - ID del proyecto
   * @returns Proyecto o null si no existe
   */
  async getProjectById(projectId: string): Promise<BackendProject | null> {
    try {
      console.log(`🔍 [PROJECT CLIENT] Getting project: ${projectId}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProject>>(
        "/glam_projects",
        {
          params: { id: `eq.${projectId}` },
          headers: await this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [PROJECT CLIENT] Project not found: ${projectId}`)
        return null
      }

      console.log(`✅ [PROJECT CLIENT] Project found: ${projectId}`)
      return response[0]
    } catch (error) {
      this.handleError("getProjectById", error)
      throw error
    }
  }

  /**
   * Obtiene un proyecto por código público
   * @param publicCode - Código público del proyecto (formato PRJ-XXXXX)
   * @returns Proyecto o null si no existe
   */
  async getProjectByPublicCode(publicCode: string): Promise<BackendProject | null> {
    try {
      console.log(`🔍 [PROJECT CLIENT] Getting project by public_code: ${publicCode}`)
      
      const response = await this.client.get<BackendArrayResponse<BackendProject>>(
        "/glam_projects",
        {
          params: { public_code: `eq.${publicCode}` },
          headers: await this.getReadHeaders(),
        }
      )

      if (!response || response.length === 0) {
        console.log(`ℹ️ [PROJECT CLIENT] Project not found by public_code: ${publicCode}`)
        return null
      }

      console.log(`✅ [PROJECT CLIENT] Project found by public_code: ${publicCode}`)
      return response[0]
    } catch (error) {
      this.handleError("getProjectByPublicCode", error)
      throw error
    }
  }

  /**
   * Crea un nuevo proyecto
   * @param data - Datos del proyecto a crear
   * @returns Proyecto creado
   */
  async createProject(data: CreateProjectDTO): Promise<BackendProject> {
    try {
      console.log(`📝 [PROJECT CLIENT] Creating project: ${data.name}`)
      
      const response = await this.client.post<BackendCreateResponse<BackendProject>>(
        "/glam_projects",
        data,
        { headers: await this.getWriteHeaders() }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when creating project")
      }

      console.log(`✅ [PROJECT CLIENT] Project created: ${response[0].id}`)
      return response[0]
    } catch (error) {
      this.handleError("createProject", error)
      throw error
    }
  }

  /**
   * Actualiza un proyecto existente
   * @param projectId - ID del proyecto
   * @param data - Datos a actualizar
   * @returns Proyecto actualizado
   */
  async updateProject(projectId: string, data: UpdateProjectDTO): Promise<BackendProject> {
    try {
      console.log(`📝 [PROJECT CLIENT] Updating project: ${projectId}`)
      
      const response = await this.client.patch<BackendUpdateResponse<BackendProject>>(
        "/glam_projects",
        data,
        {
          params: { id: `eq.${projectId}` },
          headers: await this.getWriteHeaders(),
        }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when updating project")
      }

      console.log(`✅ [PROJECT CLIENT] Project updated: ${projectId}`)
      return response[0]
    } catch (error) {
      this.handleError("updateProject", error)
      throw error
    }
  }

  /**
   * Verifica si un nombre de proyecto ya existe
   * @param name - Nombre a verificar
   * @param excludeProjectId - ID de proyecto a excluir (para edición)
   * @returns true si el nombre ya existe
   */
  async isProjectNameTaken(name: string, excludeProjectId?: string): Promise<boolean> {
    try {
      console.log(`🔍 [PROJECT CLIENT] Checking if name exists: ${name}`)
      
      const params: Record<string, string> = {
        name: `ilike.${name.trim()}`, // Case-insensitive
        select: "id",
      }
      
      if (excludeProjectId) {
        params.id = `neq.${excludeProjectId}`
      }
      
      const response = await this.client.get<BackendArrayResponse<{ id: string }>>(
        "/glam_projects",
        {
          params,
          headers: await this.getReadHeaders(),
        }
      )

      const exists = (response?.length || 0) > 0
      console.log(`✅ [PROJECT CLIENT] Name "${name}" exists: ${exists}`)
      return exists
    } catch (error) {
      this.handleError("isProjectNameTaken", error)
      throw error
    }
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  private handleError(method: string, error: unknown): void {
    if (error instanceof HttpError) {
      console.error(`❌ [PROJECT CLIENT] HTTP Error in ${method}: ${error.status}`)
      console.error(`❌ [PROJECT CLIENT] Body:`, error.body)
    } else if (error instanceof NetworkError) {
      console.error(`❌ [PROJECT CLIENT] Network Error in ${method}: ${error.message}`)
    } else {
      console.error(`❌ [PROJECT CLIENT] Unknown error in ${method}:`, error)
    }
  }
}

// Singleton instance
let projectClientInstance: ProjectClient | null = null

/**
 * Obtiene la instancia del cliente de proyectos
 * Lazy initialization para evitar errores de env vars en build time
 */
export function getProjectClient(): ProjectClient {
  if (!projectClientInstance) {
    projectClientInstance = new ProjectClient()
  }
  return projectClientInstance
}

/**
 * Mapea project_status del backend al ProjectStatus del dashboard.
 * Backend: active | paused | finished (specs/sells/sells-curl-example.md).
 */
function mapBackendStatusToProjectStatus(status: string): ProjectStatus {
  if (status === "active" || status === "paused" || status === "finished") {
    return status
  }
  return "active"
}

/**
 * Mapea una fila de project_sales_summary al tipo Project del dashboard.
 * Usa project_public_code como id y publicCode para la URL de detalle.
 */
export function mapProjectSalesSummaryRowToProject(row: ProjectSalesSummaryRow): Project {
  const status = mapBackendStatusToProjectStatus(row.project_status)
  const orders = Number(row.orders_count) || 0
  const metrics: ProjectMetrics = {
    orders,
    completedOrders: orders,
    inProgressOrders: 0,
    unitsSold: Number(row.units_sold) || 0,
    commission: Number(row.organizer_commission_total) || 0,
  }
  return {
    id: row.project_public_code,
    publicCode: row.project_public_code,
    name: row.project_name,
    status,
    metrics,
  }
}

// Re-export errors for convenience
export { HttpError, NetworkError } from "../client"
