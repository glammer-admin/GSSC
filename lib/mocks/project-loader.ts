/**
 * Mock loader para datos de proyectos
 * 
 * Simula operaciones de backend para la fase de desarrollo.
 * Sigue el patrón establecido en billing-loader.ts
 */

import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
} from "@/lib/types/project/types"
import {
  isValidStatusTransition,
  canActivateProject,
} from "@/lib/types/project/types"
import projectsData from "@/mocks/project/projects.json"

// Simular delay de red
const MOCK_DELAY = 300

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Estado en memoria para simular persistencia durante la sesión
let projectsCache: Project[] = [...projectsData.projects] as Project[]
let existingNamesCache: string[] = [...projectsData.existingNames]

/**
 * Genera un ID único para un nuevo proyecto
 */
function generateProjectId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `proj-${timestamp}-${randomPart}`
}

/**
 * Obtiene todos los proyectos de un organizador
 */
export async function getProjects(organizerId: string): Promise<Project[]> {
  await delay(MOCK_DELAY)
  return projectsCache.filter((p) => p.organizerId === organizerId)
}

/**
 * Obtiene un proyecto por ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  await delay(MOCK_DELAY)
  return projectsCache.find((p) => p.id === id) || null
}

/**
 * Verifica si un nombre de proyecto ya existe (case-insensitive)
 */
export async function isProjectNameTaken(
  name: string,
  excludeProjectId?: string
): Promise<boolean> {
  await delay(MOCK_DELAY / 2)
  const normalizedName = name.trim().toLowerCase()
  
  // Si estamos editando, excluir el proyecto actual
  if (excludeProjectId) {
    const currentProject = projectsCache.find((p) => p.id === excludeProjectId)
    if (currentProject && currentProject.name.toLowerCase() === normalizedName) {
      return false // Es el mismo proyecto, no está duplicado
    }
  }
  
  return existingNamesCache.some(
    (existingName) => existingName.toLowerCase() === normalizedName
  )
}

/**
 * Crea un nuevo proyecto
 */
export async function createProject(
  organizerId: string,
  input: CreateProjectInput
): Promise<{ success: boolean; data?: Project; error?: string }> {
  await delay(MOCK_DELAY)
  
  // Validar nombre único
  const nameTaken = await isProjectNameTaken(input.name)
  if (nameTaken) {
    return {
      success: false,
      error: "El nombre del proyecto ya existe",
    }
  }
  
  // Si intenta activar, validar requisitos
  if (input.status === "active") {
    const validation = canActivateProject(input)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors[0],
      }
    }
  }
  
  const now = new Date().toISOString()
  const newProject: Project = {
    id: generateProjectId(),
    organizerId,
    name: input.name.trim(),
    projectType: input.projectType,
    description: input.description?.trim(),
    logoUrl: input.logoFileName ? `/uploads/${input.logoFileName}` : undefined,
    commission: input.commission,
    customPackaging: input.customPackaging,
    deliveryModes: input.deliveryModes,
    status: input.status,
    hasProducts: false,
    hasActiveOrders: false,
    createdAt: now,
    updatedAt: now,
  }
  
  // Agregar al cache
  projectsCache.push(newProject)
  existingNamesCache.push(newProject.name)
  
  return {
    success: true,
    data: newProject,
  }
}

/**
 * Actualiza un proyecto existente
 */
export async function updateProject(
  id: string,
  organizerId: string,
  input: UpdateProjectInput
): Promise<{ success: boolean; data?: Project; error?: string }> {
  await delay(MOCK_DELAY)
  
  // Buscar proyecto
  const projectIndex = projectsCache.findIndex((p) => p.id === id)
  if (projectIndex === -1) {
    return {
      success: false,
      error: "Proyecto no encontrado",
    }
  }
  
  const project = projectsCache[projectIndex]
  
  // Verificar propiedad
  if (project.organizerId !== organizerId) {
    return {
      success: false,
      error: "No tienes permiso para editar este proyecto",
    }
  }
  
  // Validar transición de estado si se está cambiando
  if (input.status && input.status !== project.status) {
    if (!isValidStatusTransition(project.status, input.status)) {
      return {
        success: false,
        error: `No es posible cambiar de "${project.status}" a "${input.status}"`,
      }
    }
    
    // Si intenta activar, validar requisitos
    if (input.status === "active") {
      const projectToValidate = {
        ...project,
        ...input,
      }
      const validation = canActivateProject(projectToValidate)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors[0],
        }
      }
    }
  }
  
  // Actualizar proyecto
  const updatedProject: Project = {
    ...project,
    projectType: input.projectType ?? project.projectType,
    description: input.description !== undefined ? input.description?.trim() : project.description,
    logoUrl: input.logoFileName ? `/uploads/${input.logoFileName}` : project.logoUrl,
    commission: input.commission ?? project.commission,
    customPackaging: input.customPackaging ?? project.customPackaging,
    deliveryModes: input.deliveryModes ?? project.deliveryModes,
    status: input.status ?? project.status,
    updatedAt: new Date().toISOString(),
  }
  
  projectsCache[projectIndex] = updatedProject
  
  return {
    success: true,
    data: updatedProject,
  }
}

/**
 * Verifica si un proyecto tiene productos asociados (mock)
 */
export async function projectHasProducts(id: string): Promise<boolean> {
  await delay(MOCK_DELAY / 2)
  const project = projectsCache.find((p) => p.id === id)
  return project?.hasProducts ?? false
}

/**
 * Verifica si un proyecto tiene pedidos activos (mock)
 */
export async function projectHasActiveOrders(id: string): Promise<boolean> {
  await delay(MOCK_DELAY / 2)
  const project = projectsCache.find((p) => p.id === id)
  return project?.hasActiveOrders ?? false
}

/**
 * Resetea el cache a los datos iniciales (útil para testing)
 */
export function resetProjectsCache(): void {
  projectsCache = [...projectsData.projects] as Project[]
  existingNamesCache = [...projectsData.existingNames]
}

