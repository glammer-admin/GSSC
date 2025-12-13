/**
 * Tipos para el manejo de usuarios en la base de datos externa
 */

// Roles permitidos en el sistema
export type UserRole = "buyer" | "organizer" | "supplier"

// Estados de usuario
export type UserStatus = "Active" | "Inactive" | "Pending"

// Dirección de entrega
export interface DeliveryAddress {
  street: string
  city: string
  state: string
  country: string
  additional_info?: string
}

// Usuario completo de la base de datos
export interface GlamUser {
  id: string
  name: string
  email: string
  role: UserRole[]
  phone_number: string
  status: UserStatus
  delivery_address: DeliveryAddress
  created_at: string
  updated_at: string
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
}

// Respuesta de la API al crear usuario
export type CreateUserResponse = GlamUser

// Respuesta de la API al consultar usuario
export type GetUserResponse = GlamUser[]

// Mapeo de roles a rutas de dashboard
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  buyer: "/product/1234asdf",
  organizer: "/dashboard",
  supplier: "/customer-dash",
}

// Mapeo de roles a nombres en español
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  buyer: "Comprador",
  organizer: "Organizador",
  supplier: "Proveedor",
}

// Ya no se necesitan mapeos de conversión porque SessionRole = UserRole
// Los roles son los mismos en toda la aplicación: buyer, organizer, supplier

// Roles disponibles para selección en onboarding (supplier no disponible)
export const AVAILABLE_ROLES_FOR_REGISTRATION: UserRole[] = ["buyer", "organizer"]

