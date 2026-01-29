import { notFound, redirect } from "next/navigation"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient } from "@/lib/http/project"
import { toProject, type Project } from "@/lib/types/project/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectHeader } from "@/components/project-home/project-header"
import { ProjectSidebar } from "@/components/project-home/project-sidebar"
import { DashboardMetrics } from "@/components/project-home/dashboard-metrics"

interface ProjectDashboardPageProps {
  params: Promise<{ id: string }>
}

/**
 * Obtiene el proyecto por ID o por public_code y valida propiedad
 */
async function getProjectWithMetrics(
  idOrPublicCode: string,
  userId: string
): Promise<{
  project: Project
  metrics: {
    ordersCount: number
    unitsSold: number
    organizerCommissionTotal: number
    currency: string | null
    lastSaleAt: string | null
  }
} | null> {
  try {
    const projectClient = getProjectClient()

    // Intentar primero por public_code (formato PRJ-XXXXX), luego por ID
    let backendProject = await projectClient.getProjectByPublicCode(idOrPublicCode)

    if (!backendProject) {
      // Si no encuentra por public_code, intentar por ID
      backendProject = await projectClient.getProjectById(idOrPublicCode)
    }

    if (!backendProject) {
      return null
    }

    // RN-01: Solo el propietario (organizer_id) puede acceder
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

    const project = toProject(backendProject, logoUrl)

    // Obtener métricas de ventas
    const salesSummary = await projectClient.getProjectSalesSummaryByPublicCode(
      project.publicCode,
      userId
    )

    const metrics = {
      ordersCount: Number(salesSummary?.orders_count) || 0,
      unitsSold: Number(salesSummary?.units_sold) || 0,
      organizerCommissionTotal:
        Number(salesSummary?.organizer_commission_total) || 0,
      currency: salesSummary?.currency || null,
      lastSaleAt: salesSummary?.last_sale_at || null,
    }

    return { project, metrics }
  } catch (error) {
    console.error("Error loading project data:", error)
    return null
  }
}

export async function generateMetadata({ params }: ProjectDashboardPageProps) {
  const { id } = await params

  const session = await getSession()
  if (!session || !isCompleteSession(session)) {
    return {
      title: "Dashboard del proyecto | GSSC",
      description: "Resumen y métricas del proyecto",
    }
  }

  const userId = session.userId || session.sub
  const data = await getProjectWithMetrics(id, userId)

  return {
    title: data
      ? `${data.project.name} | GSSC`
      : "Dashboard del proyecto | GSSC",
    description: "Resumen y métricas del proyecto",
  }
}

/**
 * Página del Dashboard del Proyecto (Home)
 *
 * Server Component que:
 * - Valida sesión y rol organizer
 * - Valida propiedad del proyecto (RN-01)
 * - Redirige a 404 si no cumple las validaciones (RN-02)
 * - Muestra métricas reales de ventas (desde project_sales_summary)
 * - Muestra métricas placeholder (satisfacción, NPS, etc.) (RN-05)
 */
export default async function ProjectDashboardPage({
  params,
}: ProjectDashboardPageProps) {
  const { id } = await params

  // SSR: Validar sesión
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

  // Verificar rol organizer
  if (session.role !== "organizer") {
    notFound()
  }

  const userId = session.userId || session.sub

  // Obtener datos del proyecto y métricas
  const data = await getProjectWithMetrics(id, userId)

  if (!data) {
    notFound()
  }

  const { project, metrics } = data

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
              <DashboardMetrics
                metrics={metrics}
                commissionPercent={project.commission}
              />
            </main>
          </div>
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
