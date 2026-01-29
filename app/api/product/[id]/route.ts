import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProductClient, getProductStorageClient, HttpError, NetworkError } from "@/lib/http/product"
import { getProjectClient } from "@/lib/http/project"
import {
  validateProductName,
  validateBasePrice,
  validateModulesForCategory,
  isValidProductStatusTransition,
  canActivateProduct,
  toUpdateProductDTO,
  toProduct,
  toProductCategory,
  toProductImage,
  MIN_IMAGES_FOR_ACTIVATION,
} from "@/lib/types/product/types"
import type { UpdateProductInput, ProductResponse, SaveProductResponse } from "@/lib/types/product/types"

// Configuración del runtime para Next.js App Router
export const maxDuration = 60

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/product/[id]
 * Obtiene un producto por ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ProductResponse>> {
  try {
    const { id } = await params

    // Validar sesión
    const session = await getSession()
    
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    const userId = session.userId || session.sub
    const productClient = getProductClient()
    const projectClient = getProjectClient()

    // Obtener producto
    const backendProduct = await productClient.getProductById(id)

    if (!backendProduct) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el usuario tiene acceso al proyecto del producto
    const project = await projectClient.getProjectById(backendProduct.project_id)
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }

    if (project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver este producto" },
        { status: 403 }
      )
    }

    // Obtener categoría
    const category = await productClient.getCategoryById(backendProduct.category_id)
    
    // Obtener imágenes
    const backendImages = await productClient.getProductImages(id)
    const storageClient = getProductStorageClient()
    
    const images = backendImages.map(img => {
      const publicUrl = storageClient.getPublicUrlFromPath(img.url)
      return toProductImage(img, publicUrl)
    })

    // Transformar a formato frontend
    const product = toProduct(
      backendProduct,
      images,
      category ? toProductCategory(category) : undefined
    )

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error("Error getting product:", error)

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
 * PATCH /api/product/[id]
 * Actualiza un producto existente
 * 
 * Body (JSON):
 * - name: Nuevo nombre (opcional)
 * - description: Nueva descripción (opcional)
 * - basePrice: Nuevo precio (opcional)
 * - personalizationConfig: Nueva configuración (opcional, solo si draft)
 * - status: Nuevo estado (opcional)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SaveProductResponse>> {
  try {
    const { id } = await params

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
        { success: false, error: "No tienes permiso para editar productos" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub
    const productClient = getProductClient()
    const projectClient = getProjectClient()

    // Obtener producto actual
    const currentProduct = await productClient.getProductById(id)

    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el usuario es dueño del proyecto
    const project = await projectClient.getProjectById(currentProduct.project_id)
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      )
    }

    if (project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar este producto" },
        { status: 403 }
      )
    }

    // Parsear body
    let input: UpdateProductInput
    try {
      input = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "El body debe ser JSON válido" },
        { status: 400 }
      )
    }

    // Validar nombre si se está actualizando
    if (input.name !== undefined) {
      const nameValidation = validateProductName(input.name)
      if (!nameValidation.valid) {
        return NextResponse.json(
          { success: false, error: nameValidation.error },
          { status: 400 }
        )
      }
    }

    // Validar precio si se está actualizando
    if (input.basePrice !== undefined) {
      const priceValidation = validateBasePrice(input.basePrice)
      if (!priceValidation.valid) {
        return NextResponse.json(
          { success: false, error: priceValidation.error },
          { status: 400 }
        )
      }
    }

    // Validar que personalization_config solo se modifique si el producto está en draft
    if (input.personalizationConfig !== undefined && currentProduct.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "La configuración de personalización no puede modificarse en productos que no están en borrador" },
        { status: 400 }
      )
    }

    // Validar módulos de personalización si se están actualizando
    if (input.personalizationConfig !== undefined) {
      const category = await productClient.getCategoryById(currentProduct.category_id)
      if (category) {
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
    }

    // Validar transición de estado si se está cambiando
    if (input.status && input.status !== currentProduct.status) {
      if (!isValidProductStatusTransition(currentProduct.status, input.status)) {
        return NextResponse.json(
          { success: false, error: "La transición de estado no es válida" },
          { status: 400 }
        )
      }

      // Si intenta activar, validar requisitos
      if (input.status === "active") {
        const imageCount = await productClient.getProductImageCount(id)
        
        const productToValidate = {
          name: input.name || currentProduct.name,
          basePrice: input.basePrice ?? currentProduct.base_price,
        }
        
        const activationValidation = canActivateProduct(productToValidate, imageCount)
        if (!activationValidation.valid) {
          return NextResponse.json(
            { success: false, error: activationValidation.errors[0] },
            { status: 400 }
          )
        }
      }
    }

    // Actualizar producto en backend
    const updateDTO = toUpdateProductDTO(input)
    const backendProduct = await productClient.updateProduct(id, updateDTO)

    // Obtener categoría e imágenes para la respuesta
    const category = await productClient.getCategoryById(backendProduct.category_id)
    const backendImages = await productClient.getProductImages(id)
    const storageClient = getProductStorageClient()
    
    const images = backendImages.map(img => {
      const publicUrl = storageClient.getPublicUrlFromPath(img.url)
      return toProductImage(img, publicUrl)
    })

    // Transformar a formato frontend
    const product = toProduct(
      backendProduct,
      images,
      category ? toProductCategory(category) : undefined
    )

    console.log(`✅ [API PRODUCT] Product updated: ${product.id}`)

    return NextResponse.json({
      success: true,
      data: product,
      message: "Producto actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating product:", error)

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
