import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient, HttpError, NetworkError } from "@/lib/http/project"
import {
  validateProjectName,
  validateCommission,
  canActivateProject,
  toCreateDTO,
  toProject,
} from "@/lib/types/project/types"
import type { CreateProjectInput, SaveProjectResponse } from "@/lib/types/project/types"

// Configuración del runtime para Next.js App Router
// maxDuration aumenta el tiempo de ejecución para subidas de archivos
export const maxDuration = 60

/**
 * POST /api/project
 * Crea un nuevo proyecto
 * 
 * Acepta multipart/form-data con:
 * - data: JSON string con CreateProjectInput
 * - logo_file: File (opcional)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveProjectResponse>> {
  try {
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
        { success: false, error: "No tienes permiso para crear proyectos" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub

    // Parsear FormData
    let formData: FormData
    let input: CreateProjectInput
    let logoFile: File | null = null

    const contentType = request.headers.get("content-type") || ""
    
    if (contentType.includes("multipart/form-data")) {
      // Multipart request con posible archivo
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
      // JSON request sin archivo
      try {
        input = await request.json()
      } catch {
        return NextResponse.json(
          { success: false, error: "El body debe ser JSON válido" },
          { status: 400 }
        )
      }
    }

    // Validar nombre
    const nameValidation = validateProjectName(input.name)
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error },
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

    const projectClient = getProjectClient()

    // Verificar nombre único
    const nameTaken = await projectClient.isProjectNameTaken(input.name)
    if (nameTaken) {
      return NextResponse.json(
        { success: false, error: "El nombre del proyecto ya existe" },
        { status: 400 }
      )
    }

    // Crear proyecto en backend
    // El userId es tanto el organizer_id como el created_by/updated_by
    const createDTO = toCreateDTO(input, userId, userId)
    const backendProject = await projectClient.createProject(createDTO)

    // Si hay logo, subirlo al Storage
    let logoUrl: string | undefined
    if (logoFile) {
      try {
        const storageClient = getProjectStorageClient()
        const fileBuffer = Buffer.from(await logoFile.arrayBuffer())
        
        const uploadResult = await storageClient.uploadLogo(
          backendProject.id,
          fileBuffer,
          logoFile.name
        )

        if (uploadResult.success) {
          logoUrl = uploadResult.publicUrl
          console.log(`✅ [API PROJECT] Logo uploaded: ${logoUrl}`)
        } else {
          console.error(`⚠️ [API PROJECT] Logo upload failed: ${uploadResult.error}`)
          // El proyecto se creó pero el logo falló - no es error crítico
        }
      } catch (logoError) {
        console.error(`⚠️ [API PROJECT] Logo upload error:`, logoError)
        // El proyecto se creó pero el logo falló - no es error crítico
      }
    }

    // Transformar a formato frontend
    const project = toProject(backendProject, logoUrl)

    console.log(`✅ [API PROJECT] Project created: ${project.id}`)

    return NextResponse.json({
      success: true,
      data: project,
      message: "Proyecto creado exitosamente",
    })
  } catch (error) {
    console.error("Error creating project:", error)

    if (error instanceof HttpError) {
      // Manejar errores específicos del backend
      const errorBody = typeof error.body === "string" ? error.body : JSON.stringify(error.body)
      
      // Verificar si es error de unicidad
      if (errorBody.includes("unique") || errorBody.includes("duplicate")) {
        return NextResponse.json(
          { success: false, error: "El nombre del proyecto ya existe" },
          { status: 400 }
        )
      }

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
