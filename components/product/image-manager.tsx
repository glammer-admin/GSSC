"use client"

import { useState, useCallback } from "react"
import { Upload, ExternalLink, Phone, Trash2, ImageIcon, Loader2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  VISUAL_MODES,
  MIN_IMAGES_FOR_ACTIVATION,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_FORMATS,
  isValidImageFormat,
  isValidImageSize,
  canDeleteImage,
} from "@/lib/types/product/types"
import type { ProductImage, VisualMode, ProductStatus } from "@/lib/types/product/types"

interface ImageManagerProps {
  productId: string
  projectId: string
  images: ProductImage[]
  allowedVisualModes: VisualMode[]
  productStatus: ProductStatus
  disabled?: boolean
  error?: string
  onImagesChange: (images: ProductImage[]) => void
}

/**
 * Gestor de imágenes del producto
 * Permite subir, ver y eliminar imágenes
 * Soporta múltiples modos visuales
 */
export function ImageManager({
  productId,
  projectId,
  images,
  allowedVisualModes,
  productStatus,
  disabled = false,
  error,
  onImagesChange,
}: ImageManagerProps) {
  const [selectedMode, setSelectedMode] = useState<VisualMode>(
    allowedVisualModes.includes("upload_images") ? "upload_images" : allowedVisualModes[0]
  )
  const [isUploading, setIsUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Validar formato
    if (!isValidImageFormat(file.name)) {
      toast.error(`Formato no permitido. Use ${ALLOWED_IMAGE_FORMATS.join(", ")}`)
      return
    }

    // Validar tamaño
    if (!isValidImageSize(file.size)) {
      toast.error(`La imagen excede el tamaño máximo de ${MAX_IMAGE_SIZE_MB}MB`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("source", "upload")

      const response = await fetch(`/api/product/${productId}/images`, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al subir la imagen")
      }

      // Agregar la nueva imagen a la lista
      onImagesChange([...images, result.data])
      toast.success("Imagen subida exitosamente")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al subir la imagen"
      )
    } finally {
      setIsUploading(false)
      // Limpiar el input
      e.target.value = ""
    }
  }, [productId, images, onImagesChange])

  const handleDeleteImage = useCallback(async (imageId: string) => {
    // Verificar si se puede eliminar
    const deleteCheck = canDeleteImage(productStatus, images.length)
    if (!deleteCheck.canDelete) {
      toast.error(deleteCheck.error)
      return
    }

    setDeletingImageId(imageId)

    try {
      const response = await fetch(`/api/product/${productId}/images?imageId=${imageId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar la imagen")
      }

      // Remover la imagen de la lista
      onImagesChange(images.filter(img => img.id !== imageId))
      toast.success("Imagen eliminada")
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar la imagen"
      )
    } finally {
      setDeletingImageId(null)
    }
  }, [productId, productStatus, images, onImagesChange])

  const handleOnlineEditorClick = useCallback(() => {
    // TODO: Redirigir a la URL del editor online cuando esté disponible
    const editorUrl = process.env.NEXT_PUBLIC_ONLINE_EDITOR_URL || "#"
    window.open(`${editorUrl}?productId=${productId}`, "_blank")
  }, [productId])

  const getModeInfo = (mode: VisualMode) => {
    return VISUAL_MODES.find(m => m.id === mode)
  }

  return (
    <div className="space-y-6">
      {/* Selector de modo visual */}
      {allowedVisualModes.length > 1 && (
        <div className="space-y-3">
          <Label>Modo de generación de imágenes</Label>
          <RadioGroup
            value={selectedMode}
            onValueChange={(value) => setSelectedMode(value as VisualMode)}
            disabled={disabled}
            className="grid gap-3"
          >
            {allowedVisualModes.map((mode) => {
              const modeInfo = getModeInfo(mode)
              return (
                <div key={mode} className="flex items-center space-x-3">
                  <RadioGroupItem value={mode} id={`mode-${mode}`} />
                  <Label htmlFor={`mode-${mode}`} className="flex flex-col cursor-pointer">
                    <span className="font-medium">{modeInfo?.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {modeInfo?.description}
                    </span>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      )}

      {/* Contenido según modo seleccionado */}
      {selectedMode === "upload_images" && (
        <div className="space-y-4">
          {/* Área de subida */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              id="image-upload"
              accept={ALLOWED_IMAGE_FORMATS.map(f => `.${f}`).join(",")}
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className={`flex flex-col items-center gap-2 cursor-pointer ${
                disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploading ? (
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {isUploading ? "Subiendo..." : "Haz clic para subir una imagen"}
              </span>
              <span className="text-xs text-muted-foreground">
                {ALLOWED_IMAGE_FORMATS.join(", ").toUpperCase()} hasta {MAX_IMAGE_SIZE_MB}MB
              </span>
            </label>
          </div>

          {/* Galería de imágenes */}
          {images.length > 0 && (
            <div className="space-y-2">
              <Label>Imágenes ({images.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images
                  .sort((a, b) => a.position - b.position)
                  .map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={image.publicUrl}
                        alt={`Imagen ${image.position}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Badge de posición */}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {image.position}
                      </div>
                      
                      {/* Botón eliminar */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={disabled || deletingImageId === image.id}
                      >
                        {deletingImageId === image.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedMode === "online_editor" && (
        <div className="space-y-4">
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              El editor online te permite diseñar tu producto de forma interactiva. 
              Las imágenes generadas se guardarán automáticamente.
            </AlertDescription>
          </Alert>
          
          <Button
            type="button"
            onClick={handleOnlineEditorClick}
            disabled={disabled}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Editor Online
          </Button>

          {/* Mostrar imágenes existentes del editor */}
          {images.filter(img => img.source === "online_editor").length > 0 && (
            <div className="space-y-2">
              <Label>Imágenes del editor ({images.filter(img => img.source === "online_editor").length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images
                  .filter(img => img.source === "online_editor")
                  .sort((a, b) => a.position - b.position)
                  .map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={image.publicUrl}
                        alt={`Imagen ${image.position}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedMode === "designer_assisted" && (
        <div className="space-y-4">
          <Alert>
            <Phone className="h-4 w-4" />
            <AlertDescription>
              <strong>Diseño Asistido por Glam Urban</strong>
              <br />
              Un representante de nuestro equipo de diseño se pondrá en contacto contigo 
              para coordinar el diseño de tu producto. Este servicio puede tener costos adicionales.
            </AlertDescription>
          </Alert>
          
          <p className="text-sm text-muted-foreground text-center">
            Las imágenes serán cargadas por el equipo de Glam Urban una vez completado el diseño.
          </p>

          {/* Mostrar imágenes existentes del diseñador */}
          {images.filter(img => img.source === "designer_assisted").length > 0 && (
            <div className="space-y-2">
              <Label>Imágenes del diseñador ({images.filter(img => img.source === "designer_assisted").length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images
                  .filter(img => img.source === "designer_assisted")
                  .sort((a, b) => a.position - b.position)
                  .map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={image.publicUrl}
                        alt={`Imagen ${image.position}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicador de mínimo de imágenes */}
      <div className={`text-sm ${images.length < MIN_IMAGES_FOR_ACTIVATION ? "text-amber-600" : "text-green-600"}`}>
        {images.length < MIN_IMAGES_FOR_ACTIVATION ? (
          <>
            <ImageIcon className="h-4 w-4 inline mr-1" />
            Necesitas {MIN_IMAGES_FOR_ACTIVATION - images.length} imagen(es) más para poder activar el producto
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 inline mr-1" />
            ✓ Tienes suficientes imágenes para activar el producto
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
