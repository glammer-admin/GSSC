import { redirect, notFound } from "next/navigation"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient } from "@/lib/http/project"
import { toProject } from "@/lib/types/project/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectHeader } from "@/components/project-home/project-header"
import { ProjectSidebar } from "@/components/project-home/project-sidebar"
import { ProjectConfigForm } from "@/components/project-home/project-config-form"

interface EditProjectPageProps {
  params: Promise<{ id: string }>
}

/**
 * Obtiene el proyecto desde el backend por ID
 */
async function getProject(projectId: string, userId: string) {
  try {
    const projectClient = getProjectClient()

    const backendProject = await projectClient.getProjectById(projectId)
    
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
      const files = await storageClient.listProjectFiles(backendProject.id)
      
      if (files.length > 0) {
        const logoFile = files.find(f => f.startsWith("logo."))
        if (logoFile) {
          const extension = logoFile.split(".").pop() || "png"
          logoUrl = storageClient.getPublicUrl(backendProject.id, extension)
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
      title: "Configuración | GSSC",
      description: "Configuración del proyecto",
    }
  }
  
  const userId = session.userId || session.sub
  const project = await getProject(id, userId)
  
  return {
    title: project ? `Configuración - ${project.name} | GSSC` : "Configuración | GSSC",
    description: "Configuración del proyecto",
  }
}

/**
 * Página de configuración del proyecto
 * 
 * Server Component que:
 * - Valida sesión del usuario
 * - Verifica rol organizador
 * - Carga el proyecto por ID desde el backend
 * - Verifica propiedad del proyecto (RN-01)
 * - Reutiliza la UI de edición con nombre solo lectura (RN-03)
 * - Los cambios se registran en el modelo de auditoría (RN-04)
 */
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params
  
  // Validar sesión
  const session = await getSession()
  
  if (!session) {
    notFound()
  }
  
  // Verificar sesión completa
  if (!isCompleteSession(session)) {
    if (session.needsOnboarding) {
      redirect("/onboarding")
    }
    if (session.needsRoleSelection) {
      redirect("/select-role")
    }
    notFound()
  }
  
  // Verificar rol organizador
  if (session.role !== "organizer") {
    notFound()
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header del proyecto */}
          <ProjectHeader
            name={project.name}
            status={project.status}
          />

          {/* Layout con sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar de navegación */}
            <aside className="w-full lg:w-64 shrink-0">
              <ProjectSidebar projectId={id} />
            </aside>

            {/* Contenido principal */}
            <main className="flex-1 min-w-0">
              <div className="space-y-6">
                {/* Título de la sección */}
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Configuración</h2>
                  <p className="text-muted-foreground mt-1">
                    Ajusta la configuración de tu proyecto
                  </p>
                </div>

                {/* Formulario de configuración */}
                <ProjectConfigForm 
                  project={project} 
                  returnUrl={`/project/${id}`} 
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
