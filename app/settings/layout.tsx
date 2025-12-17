import { redirect } from "next/navigation"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"

/**
 * Layout para las páginas de Settings
 * 
 * Server Component que:
 * 1. Valida sesión y rol organizer
 * 2. Proporciona el sidebar de navegación de settings
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SSR: Validar sesión en el servidor
  const session = await getSession()
  
  if (!session) {
    redirect("/")
  }
  
  // Verificar que la sesión sea completa
  if (!isCompleteSession(session)) {
    redirect("/")
  }

  // Verificar rol organizer
  if (session.role !== "organizer") {
    // Redirigir al dashboard correcto según el rol
    if (session.role === "supplier") {
      redirect("/customer-dash")
    } else if (session.role === "buyer") {
      redirect("/product/1234asdf")
    }
    redirect("/")
  }

  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Configuración
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra tu cuenta y preferencias
            </p>
          </div>

          {/* Layout con sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar de navegación */}
            <aside className="w-full lg:w-64 shrink-0">
              <SettingsSidebar />
            </aside>

            {/* Contenido principal */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}

