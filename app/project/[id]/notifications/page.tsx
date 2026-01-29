import { notFound, redirect } from "next/navigation"
import { Bell } from "lucide-react"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient } from "@/lib/http/project"
import { toProject } from "@/lib/types/project/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectHeader } from "@/components/project-home/project-header"
import { ProjectSidebar } from "@/components/project-home/project-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface NotificationsPageProps {
  params: Promise<{ id: string }>
}

/**
 * Obtiene el proyecto por ID o por public_code y valida propiedad
 */
async function getProjectData(idOrPublicCode: string, userId: string) {
  try {
    const projectClient = getProjectClient()

    // Intentar primero por public_code, luego por ID
    let backendProject = await projectClient.getProjectByPublicCode(idOrPublicCode)

    if (!backendProject) {
      backendProject = await projectClient.getProjectById(idOrPublicCode)
    }

    if (!backendProject) {
      return null
    }

    // RN-01: Solo el propietario puede acceder
    if (backendProject.organizer_id !== userId) {
      return null
    }

    // Obtener logo
    let logoUrl: string | undefined
    try {
      const storageClient = getProjectStorageClient()
      const files = await storageClient.listProjectFiles(backendProject.id)

      if (files.length > 0) {
        const logoFile = files.find((f) => f.startsWith("logo."))
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

export async function generateMetadata({ params }: NotificationsPageProps) {
  const { id } = await params

  const session = await getSession()
  if (!session || !isCompleteSession(session)) {
    return {
      title: "Notificaciones | GSSC",
      description: "Centro de notificaciones del proyecto",
    }
  }

  const userId = session.userId || session.sub
  const project = await getProjectData(id, userId)

  return {
    title: project
      ? `Notificaciones - ${project.name} | GSSC`
      : "Notificaciones | GSSC",
    description: "Centro de notificaciones del proyecto",
  }
}

/**
 * Página de Notificaciones del Proyecto (Placeholder)
 *
 * Muestra un placeholder con mensaje "Próximamente"
 * según RN-05: Las métricas no soportadas por el modelo
 * (incluyendo notificaciones) se muestran como placeholder visual.
 */
export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { id } = await params

  // Validar sesión
  const session = await getSession()

  if (!session) {
    notFound()
  }

  if (!isCompleteSession(session)) {
    if (session.needsOnboarding) {
      redirect("/onboarding")
    }
    if (session.needsRoleSelection) {
      redirect("/select-role")
    }
    notFound()
  }

  if (session.role !== "organizer") {
    notFound()
  }

  const userId = session.userId || session.sub

  const project = await getProjectData(id, userId)

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
            publicCode={project.publicCode}
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
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Notificaciones
                  </h2>
                  <Badge variant="secondary">Próximamente</Badge>
                </div>

                {/* Placeholder */}
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Centro de notificaciones
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Pronto podrás recibir notificaciones sobre nuevas ventas,
                      cambios en pedidos y más información relevante de tu
                      proyecto.
                    </p>
                    <Badge variant="outline" className="mt-4">
                      En desarrollo
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
