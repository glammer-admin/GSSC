import { NextRequest, NextResponse } from "next/server"
import {
  getProjectById,
  updateProject,
  projectHasProducts,
  projectHasActiveOrders,
} from "@/lib/mocks/project-loader"
import {
  validateCommission,
  isValidStatusTransition,
  canActivateProject,
} from "@/lib/types/project/types"
import type { UpdateProjectInput } from "@/lib/types/project/types"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/project/[id]
 * Obtiene un proyecto por ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Obtener datos del usuario desde headers del middleware
    const userId = request.headers.get("X-User-Id")
    const userRole = request.headers.get("X-User-Role")
    
    // Validar autenticación
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }
    
    // Validar rol
    if (userRole !== "organizer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver proyectos" },
        { status: 403 }
      )
    }
    
    // Obtener proyecto
    const project = await getProjectById(id)
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }
    
    // Verificar propiedad
    if (project.organizerId !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver este proyecto" },
        { status: 403 }
      )
    }
    
    // Obtener metadata adicional
    const hasProducts = await projectHasProducts(id)
    const hasActiveOrders = await projectHasActiveOrders(id)
    
    return NextResponse.json({
      success: true,
      data: {
        ...project,
        hasProducts,
        hasActiveOrders,
      },
    })
  } catch (error) {
    console.error("Error getting project:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/project/[id]
 * Actualiza un proyecto existente
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Obtener datos del usuario desde headers del middleware
    const userId = request.headers.get("X-User-Id")
    const userRole = request.headers.get("X-User-Role")
    
    // Validar autenticación
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }
    
    // Validar rol
    if (userRole !== "organizer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar proyectos" },
        { status: 403 }
      )
    }
    
    // Obtener proyecto actual
    const currentProject = await getProjectById(id)
    
    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }
    
    // Verificar propiedad
    if (currentProject.organizerId !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar este proyecto" },
        { status: 403 }
      )
    }
    
    // Parsear body
    const body = await request.json()
    const input: UpdateProjectInput = body
    
    // Validar comisión si se está actualizando
    if (input.commission !== undefined) {
      const commissionValidation = validateCommission(input.commission)
      if (!commissionValidation.valid) {
        return NextResponse.json(
          { success: false, error: commissionValidation.error },
          { status: 400 }
        )
      }
    }
    
    // Validar transición de estado si se está cambiando
    if (input.status && input.status !== currentProject.status) {
      if (!isValidStatusTransition(currentProject.status, input.status)) {
        // Mensaje específico para proyecto finalizado
        if (currentProject.status === "finished") {
          return NextResponse.json(
            { success: false, error: "Los proyectos finalizados no pueden reactivarse" },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { success: false, error: "La transición de estado no es válida" },
          { status: 400 }
        )
      }
      
      // Si intenta activar, validar requisitos
      if (input.status === "active") {
        const projectToValidate = {
          ...currentProject,
          ...input,
        }
        const activationValidation = canActivateProject(projectToValidate)
        if (!activationValidation.valid) {
          return NextResponse.json(
            { success: false, error: activationValidation.errors[0] },
            { status: 400 }
          )
        }
      }
    }
    
    // Actualizar proyecto
    const result = await updateProject(id, userId, input)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Proyecto actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

