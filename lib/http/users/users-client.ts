/**
 * Cliente de usuarios para comunicación con la base de datos externa
 * Abstracción de operaciones CRUD de usuarios
 */

import { HttpClient, HttpError, NetworkError } from "../client"
import type {
  GlamUser,
  CreateUserDTO,
  UpdateUserDTO,
  GetUserResponse,
  CreateUserResponse,
} from "./types"

// Configuración desde variables de entorno
function getBackendConfig() {
  const apiUrl = process.env.BACKEND_API_URL
  const apiKey = process.env.BACKEND_API_KEY
  const dbSchema = process.env.BACKEND_DB_SCHEMA

  if (!apiUrl || !apiKey || !dbSchema) {
    console.error("❌ [USERS CLIENT] Missing environment variables:")
    console.error("  - BACKEND_API_URL:", !!apiUrl)
    console.error("  - BACKEND_API_KEY:", !!apiKey)
    console.error("  - BACKEND_DB_SCHEMA:", !!dbSchema)
    throw new Error("Missing backend configuration. Check environment variables.")
  }

  return { apiUrl, apiKey, dbSchema }
}

/**
 * Cliente de usuarios singleton
 */
class UsersClient {
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

  /**
   * Consulta un usuario por email
   * @param email - Email del usuario a buscar
   * @returns Usuario encontrado o null si no existe
   */
  async getUserByEmail(email: string): Promise<GlamUser | null> {
    try {
      console.log(`🔍 [USERS CLIENT] Looking up user by email: ${email}`)
      
      const response = await this.client.get<GetUserResponse>("/glam_users", {
        params: {
          email: `eq.${email}`,
        },
        headers: this.getReadHeaders(),
      })

      if (!response || response.length === 0) {
        console.log(`ℹ️ [USERS CLIENT] User not found: ${email}`)
        return null
      }

      console.log(`✅ [USERS CLIENT] User found: ${email}`)
      return response[0]
    } catch (error) {
      if (error instanceof HttpError) {
        console.error(`❌ [USERS CLIENT] HTTP Error getting user: ${error.status}`)
        throw error
      }
      if (error instanceof NetworkError) {
        console.error(`❌ [USERS CLIENT] Network Error getting user: ${error.message}`)
        throw error
      }
      console.error(`❌ [USERS CLIENT] Unknown error getting user:`, error)
      throw error
    }
  }

  /**
   * Crea un nuevo usuario
   * @param userData - Datos del usuario a crear
   * @returns Usuario creado
   */
  async createUser(userData: CreateUserDTO): Promise<GlamUser> {
    try {
      console.log(`📝 [USERS CLIENT] Creating user: ${userData.email}`)
      
      // Asegurar status por defecto
      const dataWithDefaults: CreateUserDTO = {
        ...userData,
        status: userData.status || "Active",
      }

      const response = await this.client.post<CreateUserResponse[]>(
        "/glam_users",
        dataWithDefaults,
        {
          headers: this.getWriteHeaders(),
        }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when creating user")
      }

      console.log(`✅ [USERS CLIENT] User created: ${userData.email}`)
      return response[0]
    } catch (error) {
      if (error instanceof HttpError) {
        console.error(`❌ [USERS CLIENT] HTTP Error creating user: ${error.status}`)
        throw error
      }
      if (error instanceof NetworkError) {
        console.error(`❌ [USERS CLIENT] Network Error creating user: ${error.message}`)
        throw error
      }
      console.error(`❌ [USERS CLIENT] Unknown error creating user:`, error)
      throw error
    }
  }

  /**
   * Actualiza un usuario existente
   * @param id - ID del usuario a actualizar
   * @param userData - Datos a actualizar
   * @returns Usuario actualizado
   */
  async updateUser(id: string, userData: UpdateUserDTO): Promise<GlamUser> {
    try {
      console.log(`📝 [USERS CLIENT] Updating user: ${id}`)
      
      const response = await this.client.patch<GlamUser[]>(
        "/glam_users",
        userData,
        {
          params: {
            id: `eq.${id}`,
          },
          headers: this.getWriteHeaders(),
        }
      )

      if (!response || response.length === 0) {
        throw new Error("No response from server when updating user")
      }

      console.log(`✅ [USERS CLIENT] User updated: ${id}`)
      return response[0]
    } catch (error) {
      if (error instanceof HttpError) {
        console.error(`❌ [USERS CLIENT] HTTP Error updating user: ${error.status}`)
        throw error
      }
      if (error instanceof NetworkError) {
        console.error(`❌ [USERS CLIENT] Network Error updating user: ${error.message}`)
        throw error
      }
      console.error(`❌ [USERS CLIENT] Unknown error updating user:`, error)
      throw error
    }
  }
}

// Singleton instance
let usersClientInstance: UsersClient | null = null

/**
 * Obtiene la instancia del cliente de usuarios
 * Lazy initialization para evitar errores de env vars en build time
 */
export function getUsersClient(): UsersClient {
  if (!usersClientInstance) {
    usersClientInstance = new UsersClient()
  }
  return usersClientInstance
}

// Re-export types
export type { GlamUser, CreateUserDTO, UpdateUserDTO }

