import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient } from "@/lib/http/project"
import { getProductClient, getProductStorageClient } from "@/lib/http/product"
import { toProject } from "@/lib/types/project/types"
import { toProduct, toProductCategory, toPersonalizationModule, toProductImage } from "@/lib/types/product/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProductForm } from "@/components/product/product-form"
import { ArrowLeft } from "lucide-react"

interface EditProductPageProps {
  params: Promise<{ id: string; productId: string }>
}

/**
 * Obtiene el proyecto, producto y catálogos necesarios
 */
async function getProductData(projectId: string, productId: string, userId: string) {
  try {
    const projectClient = getProjectClient()
    const productClient = getProductClient()
    const storageClient = getProductStorageClient()
    
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
    
    // Obtener producto
    const backendProduct = await productClient.getProductById(productId)
    
    if (!backendProduct || backendProduct.project_id !== projectId) {
      return null
    }
    
    // Obtener categorías y módulos
    const [backendCategories, backendModules, backendImages] = await Promise.all([
      productClient.getCategories(),
      productClient.getPersonalizationModules(),
      productClient.getProductImages(productId),
    ])
    
    const categories = backendCategories.map(toProductCategory)
    const modules = backendModules.map(toPersonalizationModule)
    
    // Transformar imágenes
    const images = backendImages.map(img => {
      const publicUrl = storageClient.getPublicUrlFromPath(img.url)
      return toProductImage(img, publicUrl)
    })
    
    // Obtener categoría del producto
    const productCategory = categories.find(c => c.id === backendProduct.category_id)
    
    const product = toProduct(backendProduct, images, productCategory)
    
    return { project, product, categories, modules }
  } catch (error) {
    console.error("Error loading product data:", error)
    return null
  }
}

export async function generateMetadata({ params }: EditProductPageProps) {
  const { id, productId } = await params
  
  const session = await getSession()
  if (!session || !isCompleteSession(session)) {
    return {
      title: "Editar producto | GSSC",
      description: "Editar configuración del producto",
    }
  }
  
  const userId = session.userId || session.sub
  const data = await getProductData(id, productId, userId)
  
  return {
    title: data ? `Editar ${data.product.name} | GSSC` : "Editar producto | GSSC",
    description: "Editar configuración del producto",
  }
}

/**
 * Página de edición de producto existente
 * 
 * Server Component que:
 * - Valida sesión del usuario
 * - Verifica rol organizador
 * - Carga el proyecto, producto y catálogos
 * - Verifica propiedad del proyecto
 * - Renderiza el formulario de edición
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id, productId } = await params
  
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
  
  // Cargar datos
  const data = await getProductData(id, productId, userId)
  
  if (!data) {
    notFound()
  }
  
  const { project, product, categories, modules } = data
  
  // Determinar si la configuración es editable (solo en draft)
  const isConfigEditable = product.status === "draft"
  
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
              Editar producto
            </h1>
            <p className="text-muted-foreground mt-1">
              Modifica la configuración de <span className="font-medium">{product.name}</span>
            </p>
            
            {!isConfigEditable && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Nota:</strong> La configuración de personalización no puede modificarse porque el producto ya fue activado. 
                  Solo puedes editar el nombre, descripción, precio e imágenes.
                </p>
              </div>
            )}
          </div>

          {/* Formulario */}
          <ProductForm 
            projectId={id}
            product={product}
            categories={categories}
            modules={modules}
            isConfigEditable={isConfigEditable}
          />
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
