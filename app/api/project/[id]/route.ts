import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient, HttpError, NetworkError } from "@/lib/http/project"
import {
  validateCommission,
  isValidStatusTransition,
  canActivateProject,
  toUpdateDTO,
  toProject,
} from "@/lib/types/project/types"
import type { UpdateProjectInput, ProjectResponse, SaveProjectResponse } from "@/lib/types/project/types"

// Configuración del runtime para Next.js App Router
export const maxDuration = 60

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/project/[id]
 * Obtiene un proyecto por ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ProjectResponse>> {
  try {
    const { id } = await params

    // Validar sesión
    const session = await getSession()
    
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar rol organizer
    if (session.role !== "organizer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver proyectos" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub
    const projectClient = getProjectClient()

    // Obtener proyecto
    const backendProject = await projectClient.getProjectById(id)

    if (!backendProject) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar propiedad
    if (backendProject.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver este proyecto" },
        { status: 403 }
      )
    }

    // Intentar obtener URL del logo
    let logoUrl: string | undefined
    try {
      const storageClient = getProjectStorageClient()
      const files = await storageClient.listProjectFiles(id)
      
      if (files.length > 0) {
        // Buscar el archivo de logo
        const logoFile = files.find(f => f.startsWith("logo."))
        if (logoFile) {
          const extension = logoFile.split(".").pop() || "png"
          logoUrl = storageClient.getPublicUrl(id, extension)
        }
      }
    } catch (storageError) {
      console.warn(`⚠️ [API PROJECT] Could not get logo URL:`, storageError)
      // No es error crítico, continuar sin logo
    }

    // Transformar a formato frontend
    const project = toProject(backendProject, logoUrl)

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error("Error getting project:", error)

    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, error: `Error del servidor: ${error.status}` },
        { status: error.status }
      )
    }

    if (error instanceof NetworkError) {
      return NextResponse.json(
        { success: false, error: "Error de conexión con el servidor" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/project/[id]
 * Actualiza un proyecto existente
 * 
 * Acepta multipart/form-data con:
 * - data: JSON string con UpdateProjectInput
 * - logo_file: File (opcional)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SaveProjectResponse>> {
  try {
    const { id } = await params

    // Validar sesión
    const session = await getSession()
    
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar rol organizer
    if (session.role !== "organizer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar proyectos" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub
    const projectClient = getProjectClient()

    // Obtener proyecto actual
    const currentProject = await projectClient.getProjectById(id)

    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar propiedad
    if (currentProject.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar este proyecto" },
        { status: 403 }
      )
    }

    // Parsear datos
    let input: UpdateProjectInput
    let logoFile: File | null = null

    const contentType = request.headers.get("content-type") || ""
    
    if (contentType.includes("multipart/form-data")) {
      let formData: FormData
      try {
        formData = await request.formData()
      } catch {
        return NextResponse.json(
          { success: false, error: "Formato de datos inválido. Use multipart/form-data." },
          { status: 400 }
        )
      }

      const dataString = formData.get("data") as string | null
      if (!dataString) {
        return NextResponse.json(
          { success: false, error: "El campo 'data' es obligatorio" },
          { status: 400 }
        )
      }

      try {
        input = JSON.parse(dataString)
      } catch {
        return NextResponse.json(
          { success: false, error: "El campo 'data' debe ser JSON válido" },
          { status: 400 }
        )
      }

      logoFile = formData.get("logo_file") as File | null
    } else {
      try {
        input = await request.json()
      } catch {
        return NextResponse.json(
          { success: false, error: "El body debe ser JSON válido" },
          { status: 400 }
        )
      }
    }

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
        // Combinar datos actuales con los nuevos para validar
        const projectToValidate = {
          name: currentProject.name,
          projectType: input.projectType || currentProject.type,
          commission: input.commission ?? currentProject.commission_percent,
          deliveryType: input.deliveryType || currentProject.delivery_type,
          deliveryConfig: input.deliveryConfig ?? currentProject.delivery_config,
          customPackaging: input.customPackaging ?? currentProject.packaging_custom,
          status: input.status,
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

    // Actualizar proyecto en backend
    // El userId es quien realiza la actualización (updated_by)
    const updateDTO = toUpdateDTO(input, userId)
    const backendProject = await projectClient.updateProject(id, updateDTO)

    // Si hay nuevo logo, subirlo al Storage (upsert)
    let logoUrl: string | undefined
    if (logoFile) {
      try {
        const storageClient = getProjectStorageClient()
        const fileBuffer = Buffer.from(await logoFile.arrayBuffer())
        
        const uploadResult = await storageClient.updateLogo(
          id,
          fileBuffer,
          logoFile.name
        )

        if (uploadResult.success) {
          logoUrl = uploadResult.publicUrl
          console.log(`✅ [API PROJECT] Logo updated: ${logoUrl}`)
        } else {
          console.error(`⚠️ [API PROJECT] Logo update failed: ${uploadResult.error}`)
        }
      } catch (logoError) {
        console.error(`⚠️ [API PROJECT] Logo update error:`, logoError)
      }
    } else {
      // Intentar obtener URL del logo existente
      try {
        const storageClient = getProjectStorageClient()
        const files = await storageClient.listProjectFiles(id)
        
        if (files.length > 0) {
          const logoFileInStorage = files.find(f => f.startsWith("logo."))
          if (logoFileInStorage) {
            const extension = logoFileInStorage.split(".").pop() || "png"
            logoUrl = storageClient.getPublicUrl(id, extension)
          }
        }
      } catch {
        // Ignorar errores al obtener logo existente
      }
    }

    // Transformar a formato frontend
    const project = toProject(backendProject, logoUrl)

    console.log(`✅ [API PROJECT] Project updated: ${project.id}`)

    return NextResponse.json({
      success: true,
      data: project,
      message: "Proyecto actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating project:", error)

    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, error: `Error del servidor: ${error.status}` },
        { status: error.status }
      )
    }

    if (error instanceof NetworkError) {
      return NextResponse.json(
        { success: false, error: "Error de conexión con el servidor" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
