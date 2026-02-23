import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProjectClient, getProjectStorageClient } from "@/lib/http/project"
import { getProductClient, getProductStorageClient } from "@/lib/http/product"
import { toProject } from "@/lib/types/project/types"
import { toProduct, toProductCategory, toProductImage } from "@/lib/types/product/types"
import type { ProductCategory } from "@/lib/types/product/types"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"
import { ProjectHeader } from "@/components/project-home/project-header"
import { ProjectSidebar } from "@/components/project-home/project-sidebar"
import { ProductList } from "@/components/product/product-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface ProductsPageProps {
  params: Promise<{ id: string }>
}

async function getProjectWithProducts(idOrPublicCode: string, userId: string) {
  try {
    const projectClient = getProjectClient()
    const productClient = getProductClient()
    
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
    
    const backendProducts = await productClient.getProductsByProject(backendProject.id)
    
    const backendCategories = await productClient.getCategories()
    const categoriesMap = new Map(backendCategories.map(c => [c.id, toProductCategory(c)]))
    const allCategories: ProductCategory[] = backendCategories.map(toProductCategory)
    
    const uniqueGlamIds = [...new Set(backendProducts.map(bp => bp.glam_product_id))]
    const glamProducts = await Promise.all(
      uniqueGlamIds.map(id => productClient.getGlamProductById(id))
    )
    const glamProductMap = new Map(
      glamProducts.filter(Boolean).map(gp => [gp!.id, gp!])
    )

    const prodStorageClient = getProductStorageClient()
    const products = await Promise.all(
      backendProducts.map(async (bp) => {
        const backendImages = await productClient.getProductImages(bp.id)
        const images = backendImages.map(img => {
          const publicUrl = prodStorageClient.getPublicUrlFromPath(img.url)
          return toProductImage(img, publicUrl)
        })
        
        const glamProduct = glamProductMap.get(bp.glam_product_id)
        const category = glamProduct ? categoriesMap.get(glamProduct.category_id) : undefined
        return toProduct(bp, images, category, glamProduct?.image_url)
      })
    )
    
    return { project, products, categories: allCategories }
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

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { id } = await params
  
  const session = await getSession()
  
  if (!session) {
    notFound()
  }
  
  if (!isCompleteSession(session)) {
    if (session.needsOnboarding) {
      redirect("/onboarding")
    }
    if (session.needsRoleSelection) {
      redirect("/select-role")
    }
    notFound()
  }
  
  if (session.role !== "organizer") {
    notFound()
  }
  
  const userId = session.userId || session.sub
  
  const data = await getProjectWithProducts(id, userId)
  
  if (!data) {
    notFound()
  }
  
  const { project, products, categories } = data
  
  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <ProjectHeader
            name={project.name}
            status={project.status}
            publicCode={project.publicCode}
          />

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 shrink-0">
              <ProjectSidebar projectId={id} />
            </aside>

            <main className="flex-1 min-w-0">
              <div className="space-y-6">
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

                <ProductList
                  products={products}
                  categories={categories}
                  projectId={id}
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}
