/**
 * Tipos del dominio de Proyectos
 * 
 * Basado en spec.md v2.0 - Creación y Edición de Proyecto
 * Alineado con backend Supabase (tabla glam_projects)
 */

// ============================================
// TIPOS BASE (alineados con backend)
// ============================================

/**
 * Estado del proyecto (RN-07: Estado inicial siempre "draft")
 */
export type ProjectStatus = "draft" | "active" | "paused" | "finished"

/**
 * Tipo de proyecto (valores del backend)
 */
export type ProjectType = 
  | "sports_team" 
  | "educational_institution" 
  | "company" 
  | "group" 
  | "other"

/**
 * Tipo de entrega (selección única - RN-15)
 */
export type DeliveryType = 
  | "organizer_location" 
  | "customer_home" 
  | "glam_urban_pickup"

/**
 * Periodicidad de entrega en sede (valores del backend)
 */
export type DeliveryPeriodicity = "weekly" | "biweekly" | "monthly" | "immediately"

/**
 * Tipo de costo de entrega a domicilio (valores del backend)
 */
export type DeliveryFeeType = "charged_to_customer" | "included_in_price"

// ============================================
// CONFIGURACIÓN DE ENTREGA (según delivery_type)
// ============================================

/**
 * Configuración para entrega en ubicación del organizador
 */
export interface OrganizerLocationConfig {
  address: string
  periodicity: DeliveryPeriodicity
}

/**
 * Configuración para entrega a domicilio del cliente
 */
export interface CustomerHomeConfig {
  delivery_fee_type: DeliveryFeeType
  delivery_fee_value?: number // En centavos, opcional
}

/**
 * Configuración de entrega según tipo
 * - organizer_location: OrganizerLocationConfig
 * - customer_home: CustomerHomeConfig
 * - glam_urban_pickup: null
 */
export type DeliveryConfig = OrganizerLocationConfig | CustomerHomeConfig | null

// ============================================
// MODELO DE PROYECTO
// ============================================

/**
 * Proyecto del backend (glam_projects)
 */
export interface BackendProject {
  id: string
  public_code: string
  organizer_id: string
  name: string
  description?: string
  type: ProjectType
  status: ProjectStatus
  commission_percent: number
  packaging_custom: boolean
  delivery_type: DeliveryType
  delivery_config: DeliveryConfig
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

/**
 * Proyecto para el frontend (transformado)
 */
export interface Project {
  id: string
  publicCode: string
  organizerId: string
  name: string
  description?: string
  projectType: ProjectType
  status: ProjectStatus
  commission: number // Decimal 0-100
  customPackaging: boolean
  deliveryType: DeliveryType
  deliveryConfig: DeliveryConfig
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// DTOs PARA API
// ============================================

/**
 * DTO para crear proyecto (POST)
 */
export interface CreateProjectDTO {
  name: string
  type: ProjectType
  description?: string
  status?: ProjectStatus // Default: draft
  commission_percent: number
  packaging_custom: boolean
  delivery_type: DeliveryType
  delivery_config: DeliveryConfig
  organizer_id: string
  created_by: string // ID del usuario que crea el proyecto (inmutable)
  updated_by: string // ID del usuario que actualiza (inicialmente igual a created_by)
}

/**
 * DTO para actualizar proyecto (PATCH)
 * name NO se puede modificar (RN-02)
 */
export interface UpdateProjectDTO {
  description?: string
  type?: ProjectType
  status?: ProjectStatus
  commission_percent?: number
  packaging_custom?: boolean
  delivery_type?: DeliveryType
  delivery_config?: DeliveryConfig
  updated_by: string // ID del usuario que actualiza (siempre obligatorio)
}

/**
 * Input del formulario para crear proyecto
 */
export interface CreateProjectInput {
  name: string
  projectType: ProjectType
  description?: string
  commission: number
  customPackaging: boolean
  deliveryType: DeliveryType
  deliveryConfig: DeliveryConfig
  status: ProjectStatus
}

/**
 * Input del formulario para actualizar proyecto
 */
export interface UpdateProjectInput {
  description?: string
  projectType?: ProjectType
  commission?: number
  customPackaging?: boolean
  deliveryType?: DeliveryType
  deliveryConfig?: DeliveryConfig
  status?: ProjectStatus
}

// ============================================
// RESPUESTAS DE API
// ============================================

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
 * Tipos de proyecto con labels (mapeo frontend ↔ backend)
 */
export const PROJECT_TYPES = [
  { id: "sports_team" as ProjectType, name: "Equipo deportivo" },
  { id: "educational_institution" as ProjectType, name: "Institución educativa" },
  { id: "company" as ProjectType, name: "Empresa" },
  { id: "group" as ProjectType, name: "Grupo" },
  { id: "other" as ProjectType, name: "Otro" },
] as const

/**
 * Tipos de entrega con labels (selección única)
 */
export const DELIVERY_TYPES = [
  { id: "organizer_location" as DeliveryType, name: "Ubicación del organizador" },
  { id: "customer_home" as DeliveryType, name: "Domicilio del cliente" },
  { id: "glam_urban_pickup" as DeliveryType, name: "Punto de retiro Glam Urban" },
] as const

/**
 * Periodicidades de entrega con labels
 */
export const DELIVERY_PERIODICITIES = [
  { id: "weekly" as DeliveryPeriodicity, name: "Semanal" },
  { id: "biweekly" as DeliveryPeriodicity, name: "Quincenal" },
  { id: "monthly" as DeliveryPeriodicity, name: "Mensual" },
  { id: "immediately" as DeliveryPeriodicity, name: "Inmediatamente" },
] as const

/**
 * Tipos de costo de entrega a domicilio con labels
 */
export const DELIVERY_FEE_TYPES = [
  { id: "charged_to_customer" as DeliveryFeeType, name: "Se cobra el domicilio al cliente" },
  { id: "included_in_price" as DeliveryFeeType, name: "Entrega gratis (incluido en precio)" },
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

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

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
 * Nombre del bucket de Storage para logos
 */
export const PROJECT_LOGOS_BUCKET = "project-logos"

/**
 * Formatos de imagen permitidos para logo (RN-11)
 */
export const ALLOWED_LOGO_FORMATS = ["png", "jpg", "jpeg", "webp", "svg"] as const

/**
 * Tamaño máximo de logo para compresión automática (2MB)
 */
export const LOGO_COMPRESSION_THRESHOLD_BYTES = 2 * 1024 * 1024

/**
 * Tamaño máximo de logo en bytes (límite del bucket: 5MB)
 */
export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024

/**
 * Tamaño máximo de logo en MB para mostrar al usuario
 */
export const MAX_LOGO_SIZE_MB = 5

/**
 * Tamaño para compresión en MB
 */
export const LOGO_COMPRESSION_THRESHOLD_MB = 2

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
 * Valida la comisión (RN-04: decimal 0-100)
 */
export function validateCommission(commission: number | undefined): { valid: boolean; error?: string } {
  if (commission === undefined || commission === null) {
    return { valid: false, error: "La comisión es obligatoria" }
  }
  
  if (typeof commission !== "number" || isNaN(commission)) {
    return { valid: false, error: "La comisión debe ser un número" }
  }
  
  if (commission < 0 || commission > 100) {
    return { valid: false, error: "La comisión debe ser un valor entre 0 y 100" }
  }
  
  return { valid: true }
}

/**
 * Verifica si el proyecto tiene un modo de entrega configurado
 */
export function hasDeliveryType(deliveryType: DeliveryType | undefined): boolean {
  return !!deliveryType
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
  
  if (!project.deliveryType) {
    errors.push("Debe seleccionar un modo de entrega para activar el proyecto")
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// FUNCIONES DE TRANSFORMACIÓN
// ============================================

/**
 * Transforma proyecto del backend al frontend
 */
export function toProject(backend: BackendProject, logoUrl?: string): Project {
  return {
    id: backend.id,
    publicCode: backend.public_code,
    organizerId: backend.organizer_id,
    name: backend.name,
    description: backend.description,
    projectType: backend.type,
    status: backend.status,
    commission: backend.commission_percent,
    customPackaging: backend.packaging_custom,
    deliveryType: backend.delivery_type,
    deliveryConfig: backend.delivery_config,
    logoUrl,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  }
}

/**
 * Transforma input del formulario a DTO para crear
 * @param input - Input del formulario
 * @param organizerId - ID del organizador dueño del proyecto
 * @param userId - ID del usuario logueado (quien crea el proyecto)
 */
export function toCreateDTO(input: CreateProjectInput, organizerId: string, userId: string): CreateProjectDTO {
  return {
    name: input.name.trim(),
    type: input.projectType,
    description: input.description?.trim(),
    status: input.status,
    commission_percent: input.commission,
    packaging_custom: input.customPackaging,
    delivery_type: input.deliveryType,
    delivery_config: input.deliveryConfig,
    organizer_id: organizerId,
    created_by: userId,
    updated_by: userId,
  }
}

/**
 * Transforma input del formulario a DTO para actualizar
 * @param input - Input del formulario
 * @param userId - ID del usuario logueado (quien actualiza el proyecto)
 */
export function toUpdateDTO(input: UpdateProjectInput, userId: string): UpdateProjectDTO {
  const dto: UpdateProjectDTO = {
    updated_by: userId, // Siempre se actualiza con el usuario logueado
  }
  
  if (input.description !== undefined) {
    dto.description = input.description?.trim()
  }
  if (input.projectType !== undefined) {
    dto.type = input.projectType
  }
  if (input.status !== undefined) {
    dto.status = input.status
  }
  if (input.commission !== undefined) {
    dto.commission_percent = input.commission
  }
  if (input.customPackaging !== undefined) {
    dto.packaging_custom = input.customPackaging
  }
  if (input.deliveryType !== undefined) {
    dto.delivery_type = input.deliveryType
  }
  if (input.deliveryConfig !== undefined) {
    dto.delivery_config = input.deliveryConfig
  }
  
  return dto
}

/**
 * Construye la URL pública del logo
 */
export function getLogoPublicUrl(baseUrl: string, projectId: string, extension: string): string {
  return `${baseUrl}/storage/v1/object/public/${PROJECT_LOGOS_BUCKET}/${projectId}/logo.${extension}`
}