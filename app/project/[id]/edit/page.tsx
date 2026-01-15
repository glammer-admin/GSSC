import { redirect, notFound } from "next/navigation"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient } from "@/lib/http/project"
import { toProject } from "@/lib/types/project/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectForm } from "@/components/project/project-form"

interface EditProjectPageProps {
  params: Promise<{ id: string }>
}

/**
 * Obtiene el proyecto desde el backend
 */
async function getProject(id: string, userId: string) {
  try {
    const projectClient = getProjectClient()
    const backendProject = await projectClient.getProjectById(id)
    
    if (!backendProject) {
      return null
    }
    
    // Verificar propiedad
    if (backendProject.organizer_id !== userId) {
      return null
    }
    
    // Intentar obtener URL del logo
    let logoUrl: string | undefined
    try {
      const storageClient = getProjectStorageClient()
      const files = await storageClient.listProjectFiles(id)
      
      if (files.length > 0) {
        const logoFile = files.find(f => f.startsWith("logo."))
        if (logoFile) {
          const extension = logoFile.split(".").pop() || "png"
          logoUrl = storageClient.getPublicUrl(id, extension)
        }
      }
    } catch {
      // Ignorar errores al obtener logo
    }
    
    return toProject(backendProject, logoUrl)
  } catch (error) {
    console.error("Error loading project:", error)
    return null
  }
}

export async function generateMetadata({ params }: EditProjectPageProps) {
  const { id } = await params
  
  // Validar sesión para metadata
  const session = await getSession()
  if (!session || !isCompleteSession(session)) {
    return {
      title: "Editar proyecto | GSSC",
      description: "Editar configuración del proyecto",
    }
  }
  
  const userId = session.userId || session.sub
  const project = await getProject(id, userId)
  
  return {
    title: project ? `Editar ${project.name} | GSSC` : "Editar proyecto | GSSC",
    description: "Editar configuración del proyecto",
  }
}

/**
 * Página de edición de proyecto existente
 * 
 * Server Component que:
 * - Valida sesión del usuario
 * - Verifica rol organizador
 * - Carga el proyecto por ID desde el backend
 * - Verifica propiedad del proyecto
 * - Renderiza el formulario de edición
 */
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params
  
  // Validar sesión
  const session = await getSession()
  
  if (!session) {
    redirect("/")
  }
  
  // Verificar sesión completa
  if (!isCompleteSession(session)) {
    if (session.needsOnboarding) {
      redirect("/onboarding")
    }
    if (session.needsRoleSelection) {
      redirect("/select-role")
    }
    redirect("/")
  }
  
  // Verificar rol organizador
  if (session.role !== "organizer") {
    redirect("/")
  }
  
  const userId = session.userId || session.sub
  
  // Cargar proyecto desde backend
  const project = await getProject(id, userId)
  
  if (!project) {
    notFound()
  }
  
  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Editar proyecto
            </h1>
            <p className="text-muted-foreground mt-1">
              Modifica la configuración de <span className="font-medium">{project.name}</span>
            </p>
          </div>

          {/* Formulario */}
          <ProjectForm project={project} />
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
