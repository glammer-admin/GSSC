/**
 * Tipos y constantes de dominio de usuarios.
 * Seguros para importar en componentes "use client".
 * Para HTTP clients y DTOs server-only, ver lib/http/users/
 */

export type UserRole = "buyer" | "organizer"

/**
 * Roles disponibles durante el registro. Incluye `supplier` (Administrador),
 * que solo se ofrece a emails del dominio admin (@glam-urban.com). Una vez
 * autenticado, una sesión con `role === "supplier"` se redirige al portal
 * de management; no se opera dentro de GSSC.
 */
export type RegistrationRole = UserRole | "supplier"

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
  buyer: "/product/1234asdf",
  organizer: "/dashboard",
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  buyer: "Comprador",
  organizer: "Organizador",
}

export const REGISTRATION_ROLE_DISPLAY_NAMES: Record<RegistrationRole, string> = {
  buyer: "Comprador",
  organizer: "Organizador",
  supplier: "Administrador",
}

export const REGISTRATION_ROLE_DESCRIPTIONS: Record<RegistrationRole, string> = {
  buyer: "Compra productos y servicios de la plataforma",
  organizer: "Organiza eventos y gestiona proyectos",
  supplier: "Gestiona las tablas madre del catálogo (portal de administración)",
}

export const AVAILABLE_REGISTRATION_ROLES: readonly UserRole[] = ["buyer", "organizer"] as const

export const ADMIN_EMAIL_DOMAIN = "glam-urban.com"

export function isAdminDomain(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
}

export function isUserRole(value: string): value is UserRole {
  return value === "buyer" || value === "organizer"
}

export function isRegistrationRole(value: string): value is RegistrationRole {
  return value === "buyer" || value === "organizer" || value === "supplier"
}

/**
 * Devuelve los roles disponibles en el formulario de registro según el email
 * del usuario. Para emails @glam-urban.com agrega `supplier` (Administrador).
 */
export function getRegistrationRolesForEmail(
  email: string | null | undefined
): readonly RegistrationRole[] {
  if (isAdminDomain(email)) {
    return ["buyer", "organizer", "supplier"] as const
  }
  return AVAILABLE_REGISTRATION_ROLES
}

/**
 * Filtra una lista de strings de DB y devuelve solo los roles válidos para GSSC.
 * El rol `supplier`/admin se ignora aquí: esos usuarios pertenecen a gssc-management,
 * no a esta app.
 */
export function toGsscRoles(roles: readonly string[] | null | undefined): UserRole[] {
  if (!roles) return []
  return roles.filter(isUserRole)
}
