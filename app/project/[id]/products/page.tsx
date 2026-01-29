import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient } from "@/lib/http/project"
import { getProductClient, getProductStorageClient } from "@/lib/http/product"
import { toProject } from "@/lib/types/project/types"
import { toProduct, toProductCategory, toProductImage, PRODUCT_STATUS_CONFIG } from "@/lib/types/product/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectHeader } from "@/components/project-home/project-header"
import { ProjectSidebar } from "@/components/project-home/project-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Package, ImageIcon, Pencil } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface ProductsPageProps {
  params: Promise<{ id: string }>
}

/**
 * Obtiene el proyecto y sus productos desde el backend (por ID o public_code)
 */
async function getProjectWithProducts(idOrPublicCode: string, userId: string) {
  try {
    const projectClient = getProjectClient()
    const productClient = getProductClient()
    
    // Intentar primero por public_code, luego por ID
    let backendProject = await projectClient.getProjectByPublicCode(idOrPublicCode)
    
    if (!backendProject) {
      backendProject = await projectClient.getProjectById(idOrPublicCode)
    }
    
    if (!backendProject) {
      return null
    }
    
    // Verificar propiedad (RN-01)
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
    
    // Obtener productos del proyecto (usando el ID interno)
    const backendProducts = await productClient.getProductsByProject(backendProject.id)
    
    // Obtener categorías para enriquecer los productos
    const backendCategories = await productClient.getCategories()
    const categoriesMap = new Map(backendCategories.map(c => [c.id, toProductCategory(c)]))
    
    // Obtener imágenes de cada producto
    const prodStorageClient = getProductStorageClient()
    const products = await Promise.all(
      backendProducts.map(async (bp) => {
        const backendImages = await productClient.getProductImages(bp.id)
        const images = backendImages.map(img => {
          const publicUrl = prodStorageClient.getPublicUrlFromPath(img.url)
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
    title: data ? `Productos - ${data.project.name} | GSSC` : "Productos | GSSC",
    description: "Gestión de productos del proyecto",
  }
}

/**
 * Página de lista de productos del proyecto
 * 
 * Server Component que:
 * - Valida sesión del usuario y rol organizador
 * - Carga el proyecto y sus productos
 * - Muestra grid de productos con nombre, categoría, estado y precio
 * - Permite acciones de activar/desactivar y editar
 */
export default async function ProductsPage({ params }: ProductsPageProps) {
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
  
  // Cargar proyecto y productos
  const data = await getProjectWithProducts(id, userId)
  
  if (!data) {
    notFound()
  }
  
  const { project, products } = data
  
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Productos</h2>
                    <p className="text-muted-foreground mt-1">
                      Gestiona los productos de tu proyecto
                    </p>
                  </div>

                  <Link href={`/project/${id}/products/new`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo producto
                    </Button>
                  </Link>
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
                        <Card 
                          key={product.id}
                          className="overflow-hidden hover:shadow-lg transition-shadow h-full"
                        >
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
                          
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {product.category?.name || "Sin categoría"}
                              </span>
                              <span className="font-semibold">
                                ${product.basePrice.toLocaleString("es-CO")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <ImageIcon className="h-3 w-3" />
                              <span>{product.images.length} imágenes</span>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              {/* Toggle Activo/Inactivo */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={product.status === "active"}
                                  disabled={product.status === "draft"}
                                  aria-label={
                                    product.status === "active"
                                      ? "Desactivar producto"
                                      : "Activar producto"
                                  }
                                />
                                <span className="text-sm text-muted-foreground">
                                  {product.status === "active" ? "Activo" : "Inactivo"}
                                </span>
                              </div>

                              {/* Botón Editar */}
                              <Link href={`/project/${id}/products/${product.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
