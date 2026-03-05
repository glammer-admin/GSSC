/**
 * Tipos y constantes de dominio de usuarios.
 * Seguros para importar en componentes "use client".
 * Para HTTP clients y DTOs server-only, ver lib/http/users/
 */

export type UserRole = "buyer" | "organizer" | "supplier"

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
  role: UserRole[]
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
  supplier: "/customer-dash",
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  buyer: "Comprador",
  organizer: "Organizador",
  supplier: "Proveedor",
}

export const AVAILABLE_ROLES_FOR_REGISTRATION: UserRole[] = ["buyer", "organizer"]
