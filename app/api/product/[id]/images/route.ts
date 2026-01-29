import { NextRequest, NextResponse } from "next/server"
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { getProductClient, getProductStorageClient, HttpError, NetworkError } from "@/lib/http/product"
import { getProjectClient } from "@/lib/http/project"
import {
  isValidImageFormat,
  isValidImageSize,
  canDeleteImage,
  toProductImage,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_FORMATS,
} from "@/lib/types/product/types"
import type { ProductImageSource, ImageUploadResponse } from "@/lib/types/product/types"

// Configuración del runtime para Next.js App Router
export const maxDuration = 60

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/product/[id]/images
 * Obtiene todas las imágenes de un producto
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: productId } = await params

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
    const product = await productClient.getProductById(productId)

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos
    const project = await projectClient.getProjectById(product.project_id)
    
    if (!project || project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver las imágenes de este producto" },
        { status: 403 }
      )
    }

    // Obtener imágenes
    const backendImages = await productClient.getProductImages(productId)
    const storageClient = getProductStorageClient()
    
    const images = backendImages.map(img => {
      const publicUrl = storageClient.getPublicUrlFromPath(img.url)
      return toProductImage(img, publicUrl)
    })

    return NextResponse.json({
      success: true,
      data: images,
    })
  } catch (error) {
    console.error("Error getting product images:", error)

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
 * POST /api/product/[id]/images
 * Sube una nueva imagen al producto
 * 
 * Acepta multipart/form-data con:
 * - file: Archivo de imagen
 * - source: Origen de la imagen (upload, online_editor, designer_assisted)
 * - position: Posición (opcional, se asigna automáticamente)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ImageUploadResponse>> {
  try {
    const { id: productId } = await params

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
        { success: false, error: "No tienes permiso para subir imágenes" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub
    const productClient = getProductClient()
    const projectClient = getProjectClient()

    // Obtener producto
    const product = await productClient.getProductById(productId)

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos
    const project = await projectClient.getProjectById(product.project_id)
    
    if (!project || project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para subir imágenes a este producto" },
        { status: 403 }
      )
    }

    // Parsear FormData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { success: false, error: "Formato de datos inválido. Use multipart/form-data." },
        { status: 400 }
      )
    }

    const file = formData.get("file") as File | null
    const source = (formData.get("source") as ProductImageSource) || "upload"
    const positionStr = formData.get("position") as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: "El archivo de imagen es obligatorio" },
        { status: 400 }
      )
    }

    // Validar formato
    if (!isValidImageFormat(file.name)) {
      return NextResponse.json(
        { success: false, error: `Formato no permitido. Use ${ALLOWED_IMAGE_FORMATS.join(", ")}` },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (!isValidImageSize(file.size)) {
      return NextResponse.json(
        { success: false, error: `La imagen excede el tamaño máximo de ${MAX_IMAGE_SIZE_MB}MB` },
        { status: 400 }
      )
    }

    // Determinar posición
    let position: number
    if (positionStr) {
      position = parseInt(positionStr, 10)
      if (isNaN(position) || position < 1) {
        return NextResponse.json(
          { success: false, error: "La posición debe ser un número mayor a 0" },
          { status: 400 }
        )
      }
    } else {
      position = await productClient.getNextImagePosition(productId)
    }

    // Subir imagen al Storage
    const storageClient = getProductStorageClient()
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    const uploadResult = await storageClient.uploadImage(
      product.project_id,
      productId,
      position,
      fileBuffer,
      file.name
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || "Error al subir la imagen" },
        { status: 500 }
      )
    }

    // Crear registro en la base de datos
    const backendImage = await productClient.createProductImage({
      product_id: productId,
      url: uploadResult.path,
      position,
      source,
    })

    const image = toProductImage(backendImage, uploadResult.publicUrl)

    console.log(`✅ [API PRODUCT IMAGES] Image uploaded: ${image.id}`)

    return NextResponse.json({
      success: true,
      data: image,
    })
  } catch (error) {
    console.error("Error uploading product image:", error)

    if (error instanceof HttpError) {
      // Si falla la BD, intentar limpiar el archivo del Storage
      // (esto es best-effort, no crítico)
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
 * DELETE /api/product/[id]/images
 * Elimina una imagen del producto
 * 
 * Query params:
 * - imageId: ID de la imagen a eliminar
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: productId } = await params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "El parámetro imageId es obligatorio" },
        { status: 400 }
      )
    }

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
        { success: false, error: "No tienes permiso para eliminar imágenes" },
        { status: 403 }
      )
    }

    const userId = session.userId || session.sub
    const productClient = getProductClient()
    const projectClient = getProjectClient()

    // Obtener producto
    const product = await productClient.getProductById(productId)

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos
    const project = await projectClient.getProjectById(product.project_id)
    
    if (!project || project.organizer_id !== userId) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para eliminar imágenes de este producto" },
        { status: 403 }
      )
    }

    // Obtener imagen actual
    const images = await productClient.getProductImages(productId)
    const imageToDelete = images.find(img => img.id === imageId)

    if (!imageToDelete) {
      return NextResponse.json(
        { success: false, error: "Imagen no encontrada" },
        { status: 404 }
      )
    }

    // Verificar si se puede eliminar (mínimo 3 imágenes para productos activos)
    const deleteCheck = canDeleteImage(product.status, images.length)
    if (!deleteCheck.canDelete) {
      return NextResponse.json(
        { success: false, error: deleteCheck.error },
        { status: 400 }
      )
    }

    // Eliminar registro de la base de datos
    await productClient.deleteProductImage(imageId)

    // Eliminar archivo del Storage
    const storageClient = getProductStorageClient()
    await storageClient.deleteImageByPath(imageToDelete.url)

    console.log(`✅ [API PRODUCT IMAGES] Image deleted: ${imageId}`)

    return NextResponse.json({
      success: true,
      message: "Imagen eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error deleting product image:", error)

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
