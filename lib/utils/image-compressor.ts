/**
 * Utilidad para compresión de imágenes en el cliente
 * 
 * Usado para comprimir logos que excedan el tamaño máximo permitido (2MB)
 */

import { MAX_LOGO_SIZE_BYTES, ALLOWED_LOGO_FORMATS } from "@/lib/types/project/types"

export interface CompressedImage {
  file: File
  dataUrl: string
  wasCompressed: boolean
  originalSize: number
  finalSize: number
}

export interface CompressionError {
  type: "format" | "compression_failed" | "too_large"
  message: string
}

/**
 * Verifica si el formato de archivo es válido
 */
export function isValidImageFormat(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension) return false
  
  return ALLOWED_LOGO_FORMATS.includes(extension as typeof ALLOWED_LOGO_FORMATS[number])
}

/**
 * Obtiene el tipo MIME según la extensión
 */
function getMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "webp":
      return "image/webp"
    default:
      return "image/jpeg"
  }
}

/**
 * Carga una imagen y retorna un elemento Image
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Error al cargar la imagen"))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Convierte un canvas a File
 */
function canvasToFile(
  canvas: HTMLCanvasElement,
  filename: string,
  mimeType: string,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Error al convertir canvas a blob"))
          return
        }
        const file = new File([blob], filename, { type: mimeType })
        resolve(file)
      },
      mimeType,
      quality
    )
  })
}

/**
 * Convierte un File a data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Error al leer el archivo"))
    reader.readAsDataURL(file)
  })
}

/**
 * Comprime una imagen si excede el tamaño máximo
 * 
 * Estrategia:
 * 1. Si la imagen es menor al límite, retornarla sin cambios
 * 2. Si es mayor, reducir calidad progresivamente
 * 3. Si aún es mayor, reducir dimensiones
 */
export async function compressImage(
  file: File
): Promise<{ success: true; data: CompressedImage } | { success: false; error: CompressionError }> {
  // Validar formato
  if (!isValidImageFormat(file)) {
    return {
      success: false,
      error: {
        type: "format",
        message: "Formato no soportado. Use PNG, JPG o WebP",
      },
    }
  }
  
  const originalSize = file.size
  
  // Si ya está dentro del límite, retornar sin comprimir
  if (file.size <= MAX_LOGO_SIZE_BYTES) {
    const dataUrl = await fileToDataUrl(file)
    return {
      success: true,
      data: {
        file,
        dataUrl,
        wasCompressed: false,
        originalSize,
        finalSize: file.size,
      },
    }
  }
  
  try {
    const img = await loadImage(file)
    const mimeType = getMimeType(file.name)
    
    // Crear canvas con las dimensiones originales
    let canvas = document.createElement("canvas")
    let ctx = canvas.getContext("2d")
    
    if (!ctx) {
      return {
        success: false,
        error: {
          type: "compression_failed",
          message: "Error al procesar la imagen",
        },
      }
    }
    
    let width = img.width
    let height = img.height
    
    // Intentar diferentes niveles de calidad
    const qualityLevels = [0.8, 0.6, 0.4, 0.3, 0.2]
    
    for (const quality of qualityLevels) {
      canvas.width = width
      canvas.height = height
      ctx = canvas.getContext("2d")
      if (!ctx) continue
      
      ctx.drawImage(img, 0, 0, width, height)
      
      const compressedFile = await canvasToFile(canvas, file.name, mimeType, quality)
      
      if (compressedFile.size <= MAX_LOGO_SIZE_BYTES) {
        const dataUrl = await fileToDataUrl(compressedFile)
        return {
          success: true,
          data: {
            file: compressedFile,
            dataUrl,
            wasCompressed: true,
            originalSize,
            finalSize: compressedFile.size,
          },
        }
      }
    }
    
    // Si la calidad no fue suficiente, reducir dimensiones
    const scaleLevels = [0.75, 0.5, 0.25]
    
    for (const scale of scaleLevels) {
      width = Math.round(img.width * scale)
      height = Math.round(img.height * scale)
      
      canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      ctx = canvas.getContext("2d")
      if (!ctx) continue
      
      ctx.drawImage(img, 0, 0, width, height)
      
      // Usar calidad media después de escalar
      const compressedFile = await canvasToFile(canvas, file.name, mimeType, 0.7)
      
      if (compressedFile.size <= MAX_LOGO_SIZE_BYTES) {
        const dataUrl = await fileToDataUrl(compressedFile)
        return {
          success: true,
          data: {
            file: compressedFile,
            dataUrl,
            wasCompressed: true,
            originalSize,
            finalSize: compressedFile.size,
          },
        }
      }
    }
    
    // Si nada funcionó, la imagen es demasiado grande
    return {
      success: false,
      error: {
        type: "too_large",
        message: "No fue posible comprimir la imagen. Por favor, seleccione una imagen más pequeña.",
      },
    }
  } catch (error) {
    console.error("Error compressing image:", error)
    return {
      success: false,
      error: {
        type: "compression_failed",
        message: "Error al procesar la imagen. Por favor, intente con otra imagen.",
      },
    }
  }
}

/**
 * Formatea el tamaño de archivo para mostrar al usuario
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

