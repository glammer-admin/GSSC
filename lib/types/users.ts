/**
 * Tipos y constantes de dominio de usuarios.
 * Seguros para importar en componentes "use client".
 * Para HTTP clients y DTOs server-only, ver lib/http/users/
 */

export type UserRole = "organizer"

export type UserStatus = "Active" | "Inactive" | "Pending"

export interface DeliveryAddress {
  street: string
  city: string
  state: string
  country: string
  additional_info?: string
}

export interface GlamUser {
  id: string
  name: string
  email: string
  role: string[]
  phone_number: string
  status: UserStatus
  delivery_address: DeliveryAddress
  auth_id?: string | null
  created_at: string
  updated_at: string
}

export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  organizer: "/dashboard",
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  organizer: "Organizador",
}

/**
 * Dominio reservado a operaciones internas/administración. GSSC es una app
 * exclusiva de organizadores: los emails de este dominio NO pueden iniciar
 * sesión aquí (se bloquean en el callback de auth).
 */
export const ADMIN_EMAIL_DOMAIN = "glam-urban.com"

export function isAdminDomain(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
}

export function isUserRole(value: string): value is UserRole {
  return value === "organizer"
}

/**
 * Filtra una lista de strings de DB y devuelve solo los roles válidos para GSSC.
 * GSSC es exclusiva de organizadores: cualquier otro rol (buyer/supplier legacy)
 * se ignora — esos usuarios no pertenecen a esta app.
 */
export function toGsscRoles(roles: readonly string[] | null | undefined): UserRole[] {
  if (!roles) return []
  return roles.filter(isUserRole)
}
