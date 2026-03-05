/**
 * Tipos HTTP server-only para usuarios.
 * Re-exporta tipos de dominio desde lib/types/users y agrega DTOs de API.
 * NO importar desde componentes "use client" — usar lib/types/users en su lugar.
 */

export type {
  UserRole,
  UserStatus,
  DeliveryAddress,
  GlamUser,
} from "@/lib/types/users"

export {
  ROLE_DASHBOARD_MAP,
  ROLE_DISPLAY_NAMES,
  AVAILABLE_ROLES_FOR_REGISTRATION,
} from "@/lib/types/users"

// DTO para crear usuario
export interface CreateUserDTO {
  name: string
  email: string
  role: UserRole[]
  phone_number: string
  status?: UserStatus
  delivery_address: DeliveryAddress
}

// DTO para actualizar usuario
export interface UpdateUserDTO {
  name?: string
  role?: UserRole[]
  phone_number?: string
  status?: UserStatus
  delivery_address?: Partial<DeliveryAddress>
  auth_id?: string  // Para backfill durante login/registro
}

// Respuesta de la API al crear usuario
export type CreateUserResponse = GlamUser

// Respuesta de la API al consultar usuario
export type GetUserResponse = GlamUser[]

