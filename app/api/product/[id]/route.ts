import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProductClient, getProductStorageClient, HttpError, NetworkError } from "@/lib/http/product"
import { getProjectClient } from "@/lib/http/project"
import {
  toProduct,
  toProductCategory,
  toProductImage,
  toUpdateProductDTO,
  isValidProductStatusTransition,
  validateProductName,
  validateProductDescription,
  validateModulesForCategory,
  ensureAllModulesPresent,
  MIN_IMAGES_FOR_ACTIVATION,
} from "@/lib/types/product/types"
import type {
  UpdateProductInput,
  SaveProductResponse,
  ProductResponse,
  ProductStatus,
} from "@/lib/types/product/types"

export const maxDuration = 60

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/product/[id]
 * Obtiene un producto por ID con sus imágenes y categoría
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ProductResponse>> {
  try {
    const session = await getSession()
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id: productId } = await context.params
    const userId = session.userId || session.sub
    const productClient = getProductClient()
    const storageClient = getProductStorageClient()

    const backendProduct = await productClient.getProductById(productId)
    if (!backendProduct) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    const projectClient = getProjectClient()
    const project = await projectClient.getProjectById(backendProduct.project_id)
    if (!project || project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver este producto" },
        { status: 403 }
      )
    }

    const [backendCategories, backendImages] = await Promise.all([
      productClient.getCategories(),
      productClient.getProductImages(productId),
    ])

    const categoriesMap = new Map(backendCategories.map(c => [c.id, toProductCategory(c)]))
    const images = backendImages.map(img => {
      const publicUrl = storageClient.getPublicUrlFromPath(img.url)
      return toProductImage(img, publicUrl)
    })

    let productCategory = categoriesMap.get(backendProduct.category_id ?? "")
    if (!productCategory && backendProduct.glam_product_id) {
      const glamProduct = await productClient.getGlamProductById(backendProduct.glam_product_id)
      if (glamProduct) {
        productCategory = categoriesMap.get(glamProduct.category_id)
      }
    }

    const product = toProduct(backendProduct, images, productCategory)

    return NextResponse.json({ success: true, data: product })
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
 * Actualiza un producto con restricciones por estado:
 * - draft: todos los campos editables
 * - active: solo name, description, status (a inactive)
 * - inactive: solo status (a active, requiere min 3 imágenes)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<SaveProductResponse>> {
  try {
    const session = await getSession()
    if (!session || !isCompleteSession(session)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    if (session.role !== "organizer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar productos" },
        { status: 403 }
      )
    }

    const { id: productId } = await context.params
    const userId = session.userId || session.sub

    let body: UpdateProductInput & { status?: ProductStatus }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "El body debe ser JSON válido" },
        { status: 400 }
      )
    }

    const productClient = getProductClient()

    const currentProduct = await productClient.getProductById(productId)
    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    const projectClient = getProjectClient()
    const project = await projectClient.getProjectById(currentProduct.project_id)
    if (!project || project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar este producto" },
        { status: 403 }
      )
    }

    const currentStatus = currentProduct.status
    const input: UpdateProductInput = body

    // ─── State-based restrictions (RN-46, RN-47) ───

    if (currentStatus === "inactive") {
      const hasDataChanges =
        input.name !== undefined ||
        input.description !== undefined ||
        input.basePrice !== undefined ||
        input.personalizationConfig !== undefined ||
        input.selectedAttributes !== undefined ||
        input.glamProductId !== undefined
      if (hasDataChanges) {
        return NextResponse.json(
          { success: false, error: "PRODUCT_INACTIVE_READONLY" },
          { status: 400 }
        )
      }
      if (input.status !== undefined && input.status !== "active") {
        return NextResponse.json(
          { success: false, error: "INVALID_STATUS_TRANSITION" },
          { status: 400 }
        )
      }
    }

    if (currentStatus === "active") {
      if (input.personalizationConfig !== undefined) {
        return NextResponse.json(
          { success: false, error: "CONFIG_IMMUTABLE" },
          { status: 400 }
        )
      }
      if (input.selectedAttributes !== undefined) {
        return NextResponse.json(
          { success: false, error: "ATTRIBUTES_IMMUTABLE" },
          { status: 400 }
        )
      }
      if (input.glamProductId !== undefined) {
        return NextResponse.json(
          { success: false, error: "CONFIG_IMMUTABLE" },
          { status: 400 }
        )
      }
      if (input.basePrice !== undefined) {
        return NextResponse.json(
          { success: false, error: "CONFIG_IMMUTABLE" },
          { status: 400 }
        )
      }
      if (input.status !== undefined && input.status !== "inactive") {
        return NextResponse.json(
          { success: false, error: "INVALID_STATUS_TRANSITION" },
          { status: 400 }
        )
      }
    }

    // ─── Status transition validation ───

    if (input.status !== undefined && input.status !== currentStatus) {
      if (!isValidProductStatusTransition(currentStatus, input.status)) {
        return NextResponse.json(
          { success: false, error: "INVALID_STATUS_TRANSITION" },
          { status: 400 }
        )
      }

      if (input.status === "active") {
        const imageCount = await productClient.getProductImageCount(productId)
        if (imageCount < MIN_IMAGES_FOR_ACTIVATION) {
          return NextResponse.json(
            {
              success: false,
              error: `El producto requiere mínimo ${MIN_IMAGES_FOR_ACTIVATION} imágenes para ser activado`,
            },
            { status: 400 }
          )
        }
      }
    }

    // ─── Draft-specific validations ───

    if (currentStatus === "draft") {
      if (input.name !== undefined) {
        const nameVal = validateProductName(input.name)
        if (!nameVal.valid) {
          return NextResponse.json(
            { success: false, error: nameVal.error },
            { status: 400 }
          )
        }
      }

      if (input.description !== undefined) {
        const descVal = validateProductDescription(input.description)
        if (!descVal.valid) {
          return NextResponse.json(
            { success: false, error: descVal.error },
            { status: 400 }
          )
        }
      }

      if (input.glamProductId !== undefined) {
        const glamProduct = await productClient.getGlamProductById(input.glamProductId)
        if (!glamProduct) {
          return NextResponse.json(
            { success: false, error: "GLAM_PRODUCT_NOT_FOUND" },
            { status: 400 }
          )
        }

        const category = await productClient.getCategoryById(glamProduct.category_id)
        if (!category) {
          return NextResponse.json(
            { success: false, error: "CATEGORY_NOT_FOUND" },
            { status: 400 }
          )
        }

        if (input.personalizationConfig) {
          const modulesVal = validateModulesForCategory(
            input.personalizationConfig,
            category.allowed_modules
          )
          if (!modulesVal.valid) {
            return NextResponse.json(
              { success: false, error: modulesVal.error },
              { status: 400 }
            )
          }
          input.personalizationConfig = ensureAllModulesPresent(
            input.personalizationConfig,
            category.allowed_modules
          )
        }
      } else if (input.personalizationConfig) {
        const glamProduct = await productClient.getGlamProductById(
          currentProduct.glam_product_id
        )
        if (glamProduct) {
          const category = await productClient.getCategoryById(glamProduct.category_id)
          if (category) {
            const modulesVal = validateModulesForCategory(
              input.personalizationConfig,
              category.allowed_modules
            )
            if (!modulesVal.valid) {
              return NextResponse.json(
                { success: false, error: modulesVal.error },
                { status: 400 }
              )
            }
            input.personalizationConfig = ensureAllModulesPresent(
              input.personalizationConfig,
              category.allowed_modules
            )
          }
        }
      }
    }

    // ─── Active-specific validations ───

    if (currentStatus === "active") {
      if (input.name !== undefined) {
        const nameVal = validateProductName(input.name)
        if (!nameVal.valid) {
          return NextResponse.json(
            { success: false, error: nameVal.error },
            { status: 400 }
          )
        }
      }
      if (input.description !== undefined) {
        const descVal = validateProductDescription(input.description)
        if (!descVal.valid) {
          return NextResponse.json(
            { success: false, error: descVal.error },
            { status: 400 }
          )
        }
      }
    }

    // ─── Build DTO and update ───

    const updateDTO = toUpdateProductDTO(input)

    if (Object.keys(updateDTO).length === 0) {
      return NextResponse.json(
        { success: false, error: "No se proporcionaron campos para actualizar" },
        { status: 400 }
      )
    }

    const updatedBackend = await productClient.updateProduct(productId, updateDTO)

    const storageClient = getProductStorageClient()
    const [backendCategories, backendImages] = await Promise.all([
      productClient.getCategories(),
      productClient.getProductImages(productId),
    ])

    const categoriesMap = new Map(backendCategories.map(c => [c.id, toProductCategory(c)]))
    const images = backendImages.map(img => {
      const publicUrl = storageClient.getPublicUrlFromPath(img.url)
      return toProductImage(img, publicUrl)
    })

    let productCategory = categoriesMap.get(updatedBackend.category_id ?? "")
    if (!productCategory && updatedBackend.glam_product_id) {
      const gp = await productClient.getGlamProductById(updatedBackend.glam_product_id)
      if (gp) productCategory = categoriesMap.get(gp.category_id)
    }

    const product = toProduct(updatedBackend, images, productCategory)

    console.log(`✅ [API PRODUCT] Product updated: ${product.id} (status: ${product.status})`)

    return NextResponse.json({
      success: true,
      data: product,
      message: "Producto actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating product:", error)

    if (error instanceof HttpError) {
      const errorBody = typeof error.body === "string" ? error.body : JSON.stringify(error.body)

      if (errorBody.includes("personalization") || errorBody.includes("selected_attributes")) {
        return NextResponse.json(
          { success: false, error: "CONFIG_IMMUTABLE" },
          { status: 400 }
        )
      }

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
