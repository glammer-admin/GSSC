"use client"

import { useState, useRef, useCallback } from "react"
import { X, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { compressImage, formatFileSize } from "@/lib/utils/image-compressor"
import { 
  MAX_LOGO_SIZE_MB, 
  LOGO_COMPRESSION_THRESHOLD_MB,
  ALLOWED_LOGO_FORMATS 
} from "@/lib/types/project/types"

interface LogoUploadProps {
  currentUrl?: string // URL del logo existente (del backend)
  selectedFile?: File // Archivo seleccionado (en memoria)
  onChange: (file: File | undefined, previewUrl: string | undefined) => void
  disabled?: boolean
  error?: string
}

/**
 * Componente para carga de logo del proyecto
 * 
 * Soporta:
 * - Drag & drop
 * - Click para seleccionar
 * - Preview de imagen
 * - Compresión automática si excede 2MB
 * - Límite máximo de 5MB (bucket)
 * - Formatos: PNG, JPG, JPEG, WebP, SVG
 */
export function LogoUpload({ 
  currentUrl, 
  selectedFile,
  onChange, 
  disabled, 
  error 
}: LogoUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [compressionMessage, setCompressionMessage] = useState<string>()
  const [localError, setLocalError] = useState<string>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)
  
  // URL a mostrar: preview del archivo seleccionado o URL existente
  const displayUrl = previewUrl || currentUrl
  
  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true)
    setLocalError(undefined)
    setCompressionMessage(undefined)
    
    try {
      const result = await compressImage(file)
      
      if (!result.success) {
        setLocalError(result.error.message)
        return
      }
      
      if (result.data.wasCompressed) {
        const originalSize = formatFileSize(result.data.originalSize)
        const finalSize = formatFileSize(result.data.finalSize)
        setCompressionMessage(`La imagen fue optimizada automáticamente (${originalSize} → ${finalSize})`)
      }
      
      // Crear File desde el dataUrl comprimido
      const response = await fetch(result.data.dataUrl)
      const blob = await response.blob()
      const compressedFile = new File([blob], file.name, { type: blob.type })
      
      setPreviewUrl(result.data.dataUrl)
      onChange(compressedFile, result.data.dataUrl)
    } catch (err) {
      console.error("Error processing image:", err)
      setLocalError("Error al procesar la imagen")
    } finally {
      setIsProcessing(false)
    }
  }, [onChange])
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input para permitir seleccionar el mismo archivo
    e.target.value = ""
  }, [handleFileSelect])
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled || isProcessing) return
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [disabled, isProcessing, handleFileSelect])
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])
  
  const handleRemove = useCallback(() => {
    setPreviewUrl(undefined)
    setCompressionMessage(undefined)
    setLocalError(undefined)
    onChange(undefined, undefined)
  }, [onChange])
  
  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      inputRef.current?.click()
    }
  }, [disabled, isProcessing])
  
  const displayError = error || localError
  const acceptFormats = ALLOWED_LOGO_FORMATS.map(f => `.${f}`).join(",")
  
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={acceptFormats}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />
      
      {displayUrl ? (
        // Preview de imagen cargada
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-lg border-2 border-border overflow-hidden bg-muted">
            <img
              src={displayUrl}
              alt="Logo del proyecto"
              className="w-full h-full object-cover"
            />
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {/* Indicador de archivo nuevo vs existente */}
          {selectedFile && (
            <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              Nuevo
            </span>
          )}
        </div>
      ) : (
        // Área de drop/click
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            w-32 h-32 rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-2
            cursor-pointer transition-colors
            ${disabled || isProcessing
              ? "border-muted bg-muted/50 cursor-not-allowed"
              : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
            }
            ${displayError ? "border-destructive" : ""}
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Procesando...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground text-center px-2">
                Arrastra o haz clic
              </span>
            </>
          )}
        </div>
      )}
      
      {/* Mensaje de compresión */}
      {compressionMessage && (
        <p className="text-xs text-muted-foreground">{compressionMessage}</p>
      )}
      
      {/* Error */}
      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
      
      {/* Información de formatos */}
      {!displayUrl && !displayError && (
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WebP o SVG. Máximo {MAX_LOGO_SIZE_MB}MB (compresión automática &gt;{LOGO_COMPRESSION_THRESHOLD_MB}MB)
        </p>
      )}
    </div>
  )
}
