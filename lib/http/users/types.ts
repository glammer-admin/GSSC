/**
 * Tipos HTTP server-only para usuarios.
 * Re-exporta tipos de dominio desde lib/types/users y agrega DTOs de API.
 * NO importar desde componentes "use client" — usar lib/types/users en su lugar.
 */

import {
  ROLE_DASHBOARD_MAP,
  type UserRole,
  type UserStatus,
  type DeliveryAddress,
  type GlamUser,
} from "@/lib/types/users"

export type { UserRole, UserStatus, DeliveryAddress, GlamUser }

export {
  ROLE_DASHBOARD_MAP,
  ROLE_DISPLAY_NAMES,
  AVAILABLE_REGISTRATION_ROLES,
  ADMIN_EMAIL_DOMAIN,
  isAdminDomain,
  isUserRole,
  toGsscRoles,
} from "@/lib/types/users"

/**
 * URL del portal de administración (gssc-management).
 * Server-only: lee process.env.MANAGEMENT_URL.
 * Devuelve null si no está configurado.
 */
export function getManagementUrl(): string | null {
  const url = process.env.MANAGEMENT_URL
  if (!url || url.length === 0) {
    console.warn("[getManagementUrl] MANAGEMENT_URL no configurada en el entorno")
    return null
  }
  return url
}

/**
 * Devuelve la URL post-login para un rol válido de GSSC (buyer/organizer).
 */
export function getRoleRedirectUrl(role: UserRole): string {
  return ROLE_DASHBOARD_MAP[role]
}

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
