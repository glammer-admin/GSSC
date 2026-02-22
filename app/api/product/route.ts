import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProductClient, HttpError, NetworkError } from "@/lib/http/product"
import { getProjectClient } from "@/lib/http/project"
import {
  validateProductName,
  validateProductDescription,
  validateBasePrice,
  validateModulesForCategory,
  ensureAllModulesPresent,
  toCreateProductDTO,
  toProduct,
  toProductCategory,
  toProductImage,
  toGlamProduct,
} from "@/lib/types/product/types"
import type { CreateProductInput, SaveProductResponse, ProductListResponse, CategoryListResponse, GlamProductListResponse } from "@/lib/types/product/types"

// Configuración del runtime para Next.js App Router
export const maxDuration = 60

/**
 * GET /api/product
 * Lista productos de un proyecto, categorías o productos del catálogo Glam Urban
 * 
 * Query params:
 * - projectId: ID del proyecto (para listar productos del proyecto)
 * - categories: true (para listar categorías)
 * - glamProducts: true (para listar productos del catálogo; requiere categoryId)
 * - categoryId: ID de la categoría (obligatorio si glamProducts=true)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ProductListResponse | CategoryListResponse | GlamProductListResponse>> {
  try {
    // Validar sesión
    const session = await getSession()
    
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const categoriesOnly = searchParams.get("categories") === "true"
    const glamProductsOnly = searchParams.get("glamProducts") === "true"
    const categoryId = searchParams.get("categoryId")

    const productClient = getProductClient()

    // Si se solicitan categorías
    if (categoriesOnly) {
      const backendCategories = await productClient.getCategories()
      const categories = backendCategories.map(toProductCategory)
      
      return NextResponse.json({
        success: true,
        data: categories,
      })
    }

    // Si se solicitan productos del catálogo Glam Urban por categoría
    if (glamProductsOnly) {
      if (!categoryId) {
        return NextResponse.json(
          { success: false, error: "El parámetro categoryId es obligatorio cuando glamProducts=true" },
          { status: 400 }
        )
      }
      const backendGlamProducts = await productClient.getGlamProductsByCategory(categoryId)
      const glamProducts = backendGlamProducts.map(toGlamProduct)
      return NextResponse.json({
        success: true,
        data: glamProducts,
      })
    }

    // Si se solicitan productos de un proyecto
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "El parámetro projectId es obligatorio" },
        { status: 400 }
      )
    }

    // Verificar que el usuario tiene acceso al proyecto
    const projectClient = getProjectClient()
    const project = await projectClient.getProjectById(projectId)
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }

    const userId = session.userId || session.sub
    if (project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver los productos de este proyecto" },
        { status: 403 }
      )
    }

    // Obtener productos del proyecto
    const backendProducts = await productClient.getProductsByProject(projectId)
    
    // Obtener categorías para enriquecer los productos
    const backendCategories = await productClient.getCategories()
    const categoriesMap = new Map(backendCategories.map(c => [c.id, toProductCategory(c)]))

    // Obtener imágenes de cada producto
    const productsWithImages = await Promise.all(
      backendProducts.map(async (bp) => {
        const backendImages = await productClient.getProductImages(bp.id)
        const images = backendImages.map(img => {
          // Extraer extensión del URL
          const extension = img.url.split(".").pop() || "png"
          const publicUrl = `${process.env.BACKEND_API_URL?.replace(/\/rest\/v1(\/.*)?$/, "")}/storage/v1/object/public/product-images/${img.url}`
          return toProductImage(img, publicUrl)
        })
        
        return toProduct(bp, images, categoriesMap.get(bp.category_id))
      })
    )

    return NextResponse.json({
      success: true,
      data: productsWithImages,
    })
  } catch (error) {
    console.error("Error getting products:", error)

    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, error: `Error del servidor: ${error.status}` },
        { status: error.status }
      )
    }

    if (error instanceof NetworkError) {
      return NextResponse.json(
        { success: false, error: "Error de conexión con el servidor" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/product
 * Crea un nuevo producto
 * 
 * Body (JSON):
 * - projectId: ID del proyecto
 * - categoryId: ID de la categoría
 * - name: Nombre del producto
 * - description: Descripción (opcional)
 * - basePrice: Precio base
 * - personalizationConfig: Configuración de módulos
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveProductResponse>> {
  try {
    // Validar sesión
    const session = await getSession()
    
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar rol organizer
    if (session.role !== "organizer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para crear productos" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub

    // Parsear body
    let body: { projectId: string } & CreateProductInput
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "El body debe ser JSON válido" },
        { status: 400 }
      )
    }

    const { projectId, ...input } = body

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "El campo projectId es obligatorio" },
        { status: 400 }
      )
    }

    // Verificar que el usuario es dueño del proyecto
    const projectClient = getProjectClient()
    const project = await projectClient.getProjectById(projectId)
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }

    if (project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para crear productos en este proyecto" },
        { status: 403 }
      )
    }

    if (!input.glamProductId) {
      return NextResponse.json(
        { success: false, error: "El campo glamProductId es obligatorio" },
        { status: 400 }
      )
    }

    const priceValidation = validateBasePrice(input.price)
    if (!priceValidation.valid) {
      return NextResponse.json(
        { success: false, error: priceValidation.error },
        { status: 400 }
      )
    }

    const nameValidation = validateProductName(input.name)
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error },
        { status: 400 }
      )
    }

    const descriptionValidation = validateProductDescription(input.description ?? "")
    if (!descriptionValidation.valid) {
      return NextResponse.json(
        { success: false, error: descriptionValidation.error },
        { status: 400 }
      )
    }

    const productClient = getProductClient()

    const glamProduct = await productClient.getGlamProductById(input.glamProductId)
    if (!glamProduct) {
      return NextResponse.json(
        { success: false, error: "Producto del catálogo no encontrado" },
        { status: 400 }
      )
    }

    const category = await productClient.getCategoryById(glamProduct.category_id)
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Categoría del producto no encontrada" },
        { status: 400 }
      )
    }

    if (input.personalizationConfig) {
      const modulesValidation = validateModulesForCategory(
        input.personalizationConfig,
        category.allowed_modules
      )
      if (!modulesValidation.valid) {
        return NextResponse.json(
          { success: false, error: modulesValidation.error },
          { status: 400 }
        )
      }
    }

    if (input.personalizationConfig) {
      input.personalizationConfig = ensureAllModulesPresent(
        input.personalizationConfig,
        category.allowed_modules
      )
    }

    const createDTO = toCreateProductDTO(input, projectId)
    const backendProduct = await productClient.createProduct(createDTO)

    const product = toProduct(backendProduct, [], toProductCategory(category))

    console.log(`✅ [API PRODUCT] Product created: ${product.id}`)

    return NextResponse.json({
      success: true,
      data: product,
      message: "Producto creado exitosamente",
    })
  } catch (error) {
    console.error("Error creating product:", error)

    if (error instanceof HttpError) {
      const errorBody = typeof error.body === "string" ? error.body : JSON.stringify(error.body)
      
      // Verificar si es error de validación
      if (errorBody.includes("check") || errorBody.includes("constraint")) {
        return NextResponse.json(
          { success: false, error: "Error de validación en los datos del producto" },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: `Error del servidor: ${error.status}` },
        { status: error.status }
      )
    }

    if (error instanceof NetworkError) {
      return NextResponse.json(
        { success: false, error: "Error de conexión con el servidor" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
