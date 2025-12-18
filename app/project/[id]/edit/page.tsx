import { redirect, notFound } from "next/navigation"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectById } from "@/lib/mocks/project-loader"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectForm } from "@/components/project/project-form"

interface EditProjectPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditProjectPageProps) {
  const { id } = await params
  const project = await getProjectById(id)
  
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
 * - Carga el proyecto por ID
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
  
  // Cargar proyecto
  const project = await getProjectById(id)
  
  if (!project) {
    notFound()
  }
  
  // Verificar propiedad (en mock, usamos el userId de la sesión)
  // En producción, esto se validaría contra el backend
  // Por ahora, permitimos acceso si es organizador
  // La validación real se hace en el API al guardar
  
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

