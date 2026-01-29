import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient } from "@/lib/http/project"
import { getProductClient } from "@/lib/http/product"
import { toProject } from "@/lib/types/project/types"
import { toProductCategory, toPersonalizationModule } from "@/lib/types/product/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProductForm } from "@/components/product/product-form"
import { ArrowLeft } from "lucide-react"

interface NewProductPageProps {
  params: Promise<{ id: string }>
}

/**
 * Obtiene el proyecto y los catálogos necesarios
 */
async function getProjectAndCatalogs(projectId: string, userId: string) {
  try {
    const projectClient = getProjectClient()
    const productClient = getProductClient()
    
    // Obtener proyecto
    const backendProject = await projectClient.getProjectById(projectId)
    
    if (!backendProject) {
      return null
    }
    
    // Verificar propiedad
    if (backendProject.organizer_id !== userId) {
      return null
    }
    
    const project = toProject(backendProject)
    
    // Obtener categorías y módulos
    const [backendCategories, backendModules] = await Promise.all([
      productClient.getCategories(),
      productClient.getPersonalizationModules(),
    ])
    
    const categories = backendCategories.map(toProductCategory)
    const modules = backendModules.map(toPersonalizationModule)
    
    return { project, categories, modules }
  } catch (error) {
    console.error("Error loading project and catalogs:", error)
    return null
  }
}

export async function generateMetadata({ params }: NewProductPageProps) {
  const { id } = await params
  
  const session = await getSession()
  if (!session || !isCompleteSession(session)) {
    return {
      title: "Nuevo producto | GSSC",
      description: "Crear un nuevo producto",
    }
  }
  
  const userId = session.userId || session.sub
  const data = await getProjectAndCatalogs(id, userId)
  
  return {
    title: data ? `Nuevo producto - ${data.project.name} | GSSC` : "Nuevo producto | GSSC",
    description: "Crear un nuevo producto para el proyecto",
  }
}

/**
 * Página de creación de nuevo producto
 * 
 * Server Component que:
 * - Valida sesión del usuario
 * - Verifica rol organizador
 * - Carga el proyecto y catálogos (categorías, módulos)
 * - Renderiza el formulario de creación
 */
export default async function NewProductPage({ params }: NewProductPageProps) {
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
  
  // Cargar proyecto y catálogos
  const data = await getProjectAndCatalogs(id, userId)
  
  if (!data) {
    notFound()
  }
  
  const { project, categories, modules } = data
  
  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href={`/project/${id}/products`} 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a productos
            </Link>
            
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo producto
            </h1>
            <p className="text-muted-foreground mt-1">
              Crea un nuevo producto para <span className="font-medium">{project.name}</span>
            </p>
          </div>

          {/* Formulario */}
          <ProductForm 
            projectId={id}
            categories={categories}
            modules={modules}
          />
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
