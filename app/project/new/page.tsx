 import { redirect } from "next/navigation"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectForm } from "@/components/project/project-form"

export const metadata = {
  title: "Crear proyecto | GSSC",
  description: "Crear un nuevo proyecto",
}

/**
 * Página de creación de nuevo proyecto
 * 
 * Server Component que:
 * - Valida sesión del usuario
 * - Verifica rol organizador
 * - Renderiza el formulario de creación
 */
export default async function NewProjectPage() {
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
  
  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Crear nuevo proyecto
            </h1>
            <p className="text-muted-foreground mt-1">
              Configura los detalles de tu nuevo proyecto
            </p>
          </div>

          {/* Formulario */}
          <ProjectForm />
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}

