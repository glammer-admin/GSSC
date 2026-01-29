import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session-manager"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { DashboardContent } from "@/components/dashboard/organizer/dashboard-content"
import { loadOrganizerDashboardData } from "@/lib/mocks/dashboard-loader"
import { getProjectClient, mapProjectSalesSummaryRowToProject } from "@/lib/http/project"

/**
 * Dashboard del Organizador
 * 
 * Página de aterrizaje para usuarios con rol `organizer`.
 * Muestra una vista ejecutiva consolidada de todos los proyectos.
 * 
 * Server Component que:
 * 1. Valida sesión y rol
 * 2. Carga proyectos desde project_sales_summary (backend)
 * 3. Carga métricas y gráficas desde mocks
 * 4. Pasa datos a Client Components
 */
export default async function Dashboard() {
  // SSR: Validar sesión en el servidor
  const session = await getSession()
  
  if (!session) {
    redirect("/")
  }
  
  // Verificar que la sesión sea completa (no temporal)
  if (!session.role) {
    redirect("/")
  }

  // Verificar rol (RN-06: Solo organizer puede acceder)
  if (session.role !== "organizer") {
    // Redirigir al dashboard correcto según el rol
    if (session.role === "supplier") {
      redirect("/customer-dash")
    } else if (session.role === "buyer") {
      redirect("/product/1234asdf")
    }
    // Cualquier otro caso, redirigir a inicio
    redirect("/")
  }

  // Proyectos: desde project_sales_summary (backend), mismo patrón que billing/proyectos
  const organizerId = session.userId || session.sub
  let projects: Awaited<ReturnType<typeof loadOrganizerDashboardData>>["projects"] = []
  try {
    const rows = await getProjectClient().getProjectSalesSummary(organizerId)
    projects = rows.map(mapProjectSalesSummaryRowToProject)
  } catch (error) {
    console.error("[Dashboard] Error loading project_sales_summary:", error)
    projects = []
  }

  // Métricas y gráficas: desde mocks (sin cambiar)
  const restData = loadOrganizerDashboardData()
  const dashboardData = {
    ...restData,
    projects,
  }

  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido, {session.name || session.email}
            </p>
          </div>

          {/* Contenido del dashboard */}
          <DashboardContent data={dashboardData} />
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
