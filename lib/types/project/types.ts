/**
 * Tipos del dominio de Proyectos
 * 
 * Basado en spec.md - Creación y Edición de Proyecto
 */

// Estado del proyecto (RN-07: Estado inicial siempre "Borrador")
export type ProjectStatus = "draft" | "active" | "paused" | "finished"

// Tipo de proyecto
export type ProjectType = "team" | "institution" | "company" | "group" | "other"

// Periodicidad de entrega en sede
export type DeliveryPeriodicity = "weekly" | "biweekly" | "monthly" | "asap"

// Tipo de costo de entrega a domicilio
export type HomeDeliveryCostType = "charged" | "free"

/**
 * Configuración de entrega en sede del organizador
 */
export interface VenueDeliveryConfig {
  enabled: boolean
  address?: string
  periodicity?: DeliveryPeriodicity
}

/**
 * Configuración de entrega a domicilio
 */
export interface HomeDeliveryConfig {
  enabled: boolean
  costType?: HomeDeliveryCostType
}

/**
 * Configuración de recolección en Glam Urban
 */
export interface PickupDeliveryConfig {
  enabled: boolean
}

/**
 * Modos de entrega del proyecto
 */
export interface DeliveryModes {
  venue: VenueDeliveryConfig
  home: HomeDeliveryConfig
  pickup: PickupDeliveryConfig
}

/**
 * Modelo completo de Proyecto
 */
export interface Project {
  id: string
  organizerId: string
  
  // Información básica
  name: string
  projectType: ProjectType
  description?: string
  logoUrl?: string
  
  // Configuración económica
  commission: number // 0-100 (RN-04)
  
  // Packaging
  customPackaging: boolean
  
  // Modos de entrega
  deliveryModes: DeliveryModes
  
  // Estado
  status: ProjectStatus
  
  // Metadata mock (para simular productos/pedidos)
  hasProducts?: boolean
  hasActiveOrders?: boolean
  
  // Auditoría
  createdAt: string
  updatedAt: string
}

/**
 * DTO para crear proyecto
 */
export interface CreateProjectInput {
  name: string
  projectType: ProjectType
  description?: string
  logoFileName?: string // En fase mock, solo el nombre del archivo
  commission: number
  customPackaging: boolean
  deliveryModes: DeliveryModes
  status: ProjectStatus
}

/**
 * DTO para actualizar proyecto
 */
export interface UpdateProjectInput {
  // name NO se puede modificar (RN-02)
  projectType?: ProjectType
  description?: string
  logoFileName?: string
  commission?: number
  customPackaging?: boolean
  deliveryModes?: DeliveryModes
  status?: ProjectStatus
}

/**
 * Respuesta del API al obtener proyecto
 */
export interface ProjectResponse {
  success: boolean
  data?: Project
  error?: string
}

/**
 * Respuesta del API al crear/actualizar proyecto
 */
export interface SaveProjectResponse {
  success: boolean
  data?: Project
  error?: string
  message?: string
}

/**
 * Respuesta del API al listar proyectos
 */
export interface ProjectListResponse {
  success: boolean
  data?: Project[]
  error?: string
}

// ============================================
// CONSTANTES DEL DOMINIO
// ============================================

/**
 * Tipos de proyecto con labels
 */
export const PROJECT_TYPES = [
  { id: "team" as ProjectType, name: "Equipo" },
  { id: "institution" as ProjectType, name: "Institución" },
  { id: "company" as ProjectType, name: "Empresa" },
  { id: "group" as ProjectType, name: "Grupo" },
  { id: "other" as ProjectType, name: "Otro" },
] as const

/**
 * Periodicidades de entrega con labels
 */
export const DELIVERY_PERIODICITIES = [
  { id: "weekly" as DeliveryPeriodicity, name: "Semanal" },
  { id: "biweekly" as DeliveryPeriodicity, name: "Quincenal" },
  { id: "monthly" as DeliveryPeriodicity, name: "Mensual" },
  { id: "asap" as DeliveryPeriodicity, name: "Lo más pronto posible" },
] as const

/**
 * Tipos de costo de entrega a domicilio con labels
 */
export const HOME_DELIVERY_COST_TYPES = [
  { id: "charged" as HomeDeliveryCostType, name: "Se cobra el domicilio al cliente" },
  { id: "free" as HomeDeliveryCostType, name: "Entrega gratis" },
] as const

/**
 * Estados del proyecto con labels y colores
 */
export const PROJECT_STATUS_CONFIG = {
  draft: {
    label: "Borrador",
    color: "gray",
    description: "Proyecto en configuración, no visible públicamente",
  },
  active: {
    label: "Activo",
    color: "green",
    description: "Proyecto visible en tienda pública, acepta pedidos",
  },
  paused: {
    label: "Pausado",
    color: "yellow",
    description: "Proyecto no acepta nuevos pedidos, procesa existentes",
  },
  finished: {
    label: "Finalizado",
    color: "red",
    description: "Proyecto cerrado permanentemente",
  },
} as const

/**
 * Transiciones de estado válidas (RN-08: Finalizado no puede reactivarse)
 */
export const VALID_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ["active"],
  active: ["paused", "finished"],
  paused: ["active", "finished"],
  finished: [], // No puede transicionar a ningún estado
}

/**
 * Verifica si una transición de estado es válida
 */
export function isValidStatusTransition(
  currentStatus: ProjectStatus,
  newStatus: ProjectStatus
): boolean {
  if (currentStatus === newStatus) return true
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus)
}

/**
 * Obtiene los estados disponibles para transición desde el estado actual
 */
export function getAvailableStatusTransitions(currentStatus: ProjectStatus): ProjectStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus]
}

// ============================================
// CONFIGURACIÓN DE ARCHIVOS
// ============================================

/**
 * Formatos de imagen permitidos para logo (RN-11)
 */
export const ALLOWED_LOGO_FORMATS = ["png", "jpg", "jpeg", "webp"] as const

/**
 * Tamaño máximo de logo en bytes (RN-12: 2MB)
 */
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

/**
 * Tamaño máximo de logo en MB para mostrar al usuario
 */
export const MAX_LOGO_SIZE_MB = 2

/**
 * Longitud máxima del nombre del proyecto (RN-03)
 */
export const MAX_PROJECT_NAME_LENGTH = 100

/**
 * Longitud máxima de la descripción corta (RN-13)
 */
export const MAX_DESCRIPTION_LENGTH = 500

/**
 * Regex para validar nombre del proyecto (RN-03: alfanumérico + espacios)
 */
export const PROJECT_NAME_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+$/

/**
 * Valida el nombre del proyecto
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim()
  
  if (!trimmed) {
    return { valid: false, error: "El nombre del proyecto es obligatorio" }
  }
  
  if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
    return { valid: false, error: `El nombre no puede exceder ${MAX_PROJECT_NAME_LENGTH} caracteres` }
  }
  
  if (!PROJECT_NAME_REGEX.test(trimmed)) {
    return { valid: false, error: "El nombre solo puede contener letras, números y espacios" }
  }
  
  return { valid: true }
}

/**
 * Valida la comisión (RN-04)
 */
export function validateCommission(commission: number | undefined): { valid: boolean; error?: string } {
  if (commission === undefined || commission === null) {
    return { valid: false, error: "La comisión es obligatoria" }
  }
  
  if (!Number.isInteger(commission)) {
    return { valid: false, error: "La comisión debe ser un número entero" }
  }
  
  if (commission < 0 || commission > 100) {
    return { valid: false, error: "La comisión debe ser un valor entre 0 y 100" }
  }
  
  return { valid: true }
}

/**
 * Verifica si el proyecto tiene al menos un modo de entrega habilitado
 */
export function hasDeliveryMode(deliveryModes: DeliveryModes): boolean {
  return (
    deliveryModes.venue.enabled ||
    deliveryModes.home.enabled ||
    deliveryModes.pickup.enabled
  )
}

/**
 * Valida si el proyecto puede ser activado (RN-05, RN-06)
 */
export function canActivateProject(project: Partial<CreateProjectInput>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!project.name?.trim()) {
    errors.push("El nombre del proyecto es obligatorio")
  }
  
  if (!project.projectType) {
    errors.push("El tipo de proyecto es obligatorio")
  }
  
  if (project.commission === undefined || project.commission === null) {
    errors.push("Debe definir la comisión para activar el proyecto")
  }
  
  if (!project.deliveryModes || !hasDeliveryMode(project.deliveryModes)) {
    errors.push("Debe seleccionar al menos un modo de entrega para activar el proyecto")
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Modos de entrega por defecto (todos deshabilitados)
 */
export const DEFAULT_DELIVERY_MODES: DeliveryModes = {
  venue: { enabled: false },
  home: { enabled: false },
  pickup: { enabled: false },
}

