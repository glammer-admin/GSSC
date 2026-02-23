import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient } from "@/lib/http/project"
import { getProductClient, getProductStorageClient } from "@/lib/http/product"
import { toProject } from "@/lib/types/project/types"
import {
  toProduct,
  toProductCategory,
  toPersonalizationModule,
  toProductImage,
  toGlamProduct,
} from "@/lib/types/product/types"
import type { GlamProduct } from "@/lib/types/product/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProductForm } from "@/components/product/product-form"
import { ArrowLeft } from "lucide-react"

interface EditProductPageProps {
  params: Promise<{ id: string; productId: string }>
}

async function getProductData(idOrPublicCode: string, productId: string, userId: string) {
  try {
    const projectClient = getProjectClient()
    const productClient = getProductClient()
    const storageClient = getProductStorageClient()
    
    let backendProject = await projectClient.getProjectByPublicCode(idOrPublicCode)
    
    if (!backendProject) {
      backendProject = await projectClient.getProjectById(idOrPublicCode)
    }
    
    if (!backendProject) {
      return null
    }
    
    if (backendProject.organizer_id !== userId) {
      return null
    }
    
    const project = toProject(backendProject)
    
    const backendProduct = await productClient.getProductById(productId)
    
    if (!backendProduct || backendProduct.project_id !== backendProject.id) {
      return null
    }
    
    const [backendCategories, backendModules, backendImages] = await Promise.all([
      productClient.getCategories(),
      productClient.getPersonalizationModules(),
      productClient.getProductImages(productId),
    ])
    
    const categories = backendCategories.map(toProductCategory)
    const modules = backendModules.map(toPersonalizationModule)
    
    const images = backendImages.map(img => {
      const publicUrl = storageClient.getPublicUrlFromPath(img.url)
      return toProductImage(img, publicUrl)
    })
    
    let productCategory = categories.find(c => c.id === backendProduct.category_id)
    if (!productCategory && backendProduct.glam_product_id) {
      const glamProduct = await productClient.getGlamProductById(backendProduct.glam_product_id)
      if (glamProduct) {
        productCategory = categories.find(c => c.id === glamProduct.category_id)
      }
    }
    
    const product = toProduct(backendProduct, images, productCategory)

    // Load the glam_product data for the current product (RN-49)
    let glamProductData: GlamProduct | undefined
    if (backendProduct.glam_product_id) {
      const backendGlam = await productClient.getGlamProductById(backendProduct.glam_product_id)
      if (backendGlam) {
        glamProductData = toGlamProduct(backendGlam)
      }
    }

    // Load all glam_products for the product's category (for selector in draft)
    let glamProductsForCategory: GlamProduct[] = []
    if (productCategory) {
      const backendGlamProducts = await productClient.getGlamProductsByCategory(productCategory.id)
      glamProductsForCategory = backendGlamProducts.map(toGlamProduct)
    }
    
    return {
      project,
      product,
      categories,
      modules,
      glamProductData,
      glamProductsForCategory,
    }
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

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id, productId } = await params
  
  const session = await getSession()
  
  if (!session) {
    redirect("/")
  }
  
  if (!isCompleteSession(session)) {
    if (session.needsOnboarding) {
      redirect("/onboarding")
    }
    if (session.needsRoleSelection) {
      redirect("/select-role")
    }
    redirect("/")
  }
  
  if (session.role !== "organizer") {
    redirect("/")
  }
  
  const userId = session.userId || session.sub
  
  const data = await getProductData(id, productId, userId)
  
  if (!data) {
    notFound()
  }
  
  const { project, product, categories, modules, glamProductData, glamProductsForCategory } = data

  const isDraft = product.status === "draft"
  const isActive = product.status === "active"
  const isInactive = product.status === "inactive"

  const isConfigEditable = isDraft
  const isDataEditable = isDraft || isActive

  const statusMessage = isInactive
    ? "Este producto está inactivo. Todos los campos son de solo lectura. Solo puedes reactivar el producto."
    : isActive
    ? "La configuración de categoría, producto del catálogo, atributos y personalización no puede modificarse porque el producto está activo. Solo puedes editar el nombre, descripción y estado."
    : null
  
  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
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
            
            {statusMessage && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Nota:</strong> {statusMessage}
                </p>
              </div>
            )}
          </div>

          <ProductForm 
            projectId={project.id}
            product={product}
            categories={categories}
            modules={modules}
            isConfigEditable={isConfigEditable}
            isDataEditable={isDataEditable}
            project={{ commission: project.commission }}
            glamProducts={glamProductsForCategory}
            selectedGlamProduct={glamProductData}
          />
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
