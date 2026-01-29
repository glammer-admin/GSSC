import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient } from "@/lib/http/project"
import { getProductClient, getProductStorageClient } from "@/lib/http/product"
import { toProject } from "@/lib/types/project/types"
import { toProduct, toProductCategory, toProductImage, PRODUCT_STATUS_CONFIG } from "@/lib/types/product/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Package, ArrowLeft, ImageIcon } from "lucide-react"

interface ProductsPageProps {
  params: Promise<{ id: string }>
}

/**
 * Obtiene el proyecto y sus productos desde el backend
 */
async function getProjectWithProducts(projectId: string, userId: string) {
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
    
    // Obtener productos del proyecto
    const backendProducts = await productClient.getProductsByProject(projectId)
    
    // Obtener categorías para enriquecer los productos
    const backendCategories = await productClient.getCategories()
    const categoriesMap = new Map(backendCategories.map(c => [c.id, toProductCategory(c)]))
    
    // Obtener imágenes de cada producto
    const storageClient = getProductStorageClient()
    const products = await Promise.all(
      backendProducts.map(async (bp) => {
        const backendImages = await productClient.getProductImages(bp.id)
        const images = backendImages.map(img => {
          const publicUrl = storageClient.getPublicUrlFromPath(img.url)
          return toProductImage(img, publicUrl)
        })
        
        return toProduct(bp, images, categoriesMap.get(bp.category_id))
      })
    )
    
    return { project, products }
  } catch (error) {
    console.error("Error loading project with products:", error)
    return null
  }
}

export async function generateMetadata({ params }: ProductsPageProps) {
  const { id } = await params
  
  const session = await getSession()
  if (!session || !isCompleteSession(session)) {
    return {
      title: "Productos | GSSC",
      description: "Gestión de productos del proyecto",
    }
  }
  
  const userId = session.userId || session.sub
  const data = await getProjectWithProducts(id, userId)
  
  return {
    title: data ? `Productos de ${data.project.name} | GSSC` : "Productos | GSSC",
    description: "Gestión de productos del proyecto",
  }
}

/**
 * Página de lista de productos del proyecto
 * 
 * Server Component que:
 * - Valida sesión del usuario
 * - Verifica rol organizador
 * - Carga el proyecto y sus productos
 * - Muestra grid de productos con estado
 */
export default async function ProductsPage({ params }: ProductsPageProps) {
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
  
  // Cargar proyecto y productos
  const data = await getProjectWithProducts(id, userId)
  
  if (!data) {
    notFound()
  }
  
  const { project, products } = data
  
  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al dashboard
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Productos
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona los productos de <span className="font-medium">{project.name}</span>
                </p>
              </div>
              
              <Link href={`/project/${id}/products/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo producto
                </Button>
              </Link>
            </div>
          </div>

          {/* Lista de productos */}
          {products.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Aún no has creado ningún producto para este proyecto. 
                  Comienza creando tu primer producto.
                </p>
                <Link href={`/project/${id}/products/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer producto
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const statusConfig = PRODUCT_STATUS_CONFIG[product.status]
                const mainImage = product.images.find(img => img.position === 1) || product.images[0]
                
                return (
                  <Link 
                    key={product.id} 
                    href={`/project/${id}/products/${product.id}/edit`}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      {/* Imagen del producto */}
                      <div className="aspect-square bg-muted relative">
                        {mainImage ? (
                          <img
                            src={mainImage.publicUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                          </div>
                        )}
                        
                        {/* Badge de estado */}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={
                              product.status === "active" ? "default" :
                              product.status === "draft" ? "secondary" :
                              "destructive"
                            }
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg line-clamp-1">
                          {product.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {product.description || "Sin descripción"}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {product.category?.name || "Sin categoría"}
                          </span>
                          <span className="font-semibold">
                            ${product.basePrice.toLocaleString("es-CO")}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />
                          <span>{product.images.length} imágenes</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
