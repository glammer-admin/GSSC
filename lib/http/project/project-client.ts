/**
 * Cliente HTTP para proyectos (glam_projects)
 * Comunicación con el backend de Supabase via REST API
 */

import { HttpClient, HttpError, NetworkError } from "../client"
import type {
  BackendProject,
  CreateProjectDTO,
  UpdateProjectDTO,
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
          headers: this.getReadHeaders(),
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
          headers: this.getReadHeaders(),
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
        { headers: this.getWriteHeaders() }
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
          headers: this.getWriteHeaders(),
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
          headers: this.getReadHeaders(),
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

// Re-export errors for convenience
export { HttpError, NetworkError } from "../client"
