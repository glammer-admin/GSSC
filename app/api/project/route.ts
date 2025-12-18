import { NextRequest, NextResponse } from "next/server"
import { createProject, isProjectNameTaken } from "@/lib/mocks/project-loader"
import {
  validateProjectName,
  validateCommission,
  canActivateProject,
} from "@/lib/types/project/types"
import type { CreateProjectInput } from "@/lib/types/project/types"

/**
 * POST /api/project
 * Crea un nuevo proyecto
 * 
 * Headers requeridos (propagados por middleware):
 * - X-User-Id: ID del organizador
 * - X-User-Role: Debe ser "organizer"
 */
export async function POST(request: NextRequest) {
  try {
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
        { success: false, error: "No tienes permiso para crear proyectos" },
        { status: 403 }
      )
    }
    
    // Parsear body
    const body = await request.json()
    const input: CreateProjectInput = body
    
    // Validar nombre
    const nameValidation = validateProjectName(input.name)
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error },
        { status: 400 }
      )
    }
    
    // Verificar nombre único
    const nameTaken = await isProjectNameTaken(input.name)
    if (nameTaken) {
      return NextResponse.json(
        { success: false, error: "El nombre del proyecto ya existe" },
        { status: 400 }
      )
    }
    
    // Validar comisión
    const commissionValidation = validateCommission(input.commission)
    if (!commissionValidation.valid) {
      return NextResponse.json(
        { success: false, error: commissionValidation.error },
        { status: 400 }
      )
    }
    
    // Si intenta activar, validar requisitos adicionales
    if (input.status === "active") {
      const activationValidation = canActivateProject(input)
      if (!activationValidation.valid) {
        return NextResponse.json(
          { success: false, error: activationValidation.errors[0] },
          { status: 400 }
        )
      }
    }
    
    // Crear proyecto
    const result = await createProject(userId, input)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Proyecto creado exitosamente",
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

