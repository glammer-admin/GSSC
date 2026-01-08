"use client"

import { useRef, useState } from "react"
import { Upload, File, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BillingDocumentType } from "@/lib/types/billing/types"

interface DocumentUploadProps {
  label: string
  accept: string
  documentType: BillingDocumentType
  currentFile?: string
  /**
   * Callback cuando se selecciona o elimina un archivo.
   * Recibe el objeto File o undefined si se elimina.
   * El archivo NO se sube inmediatamente, se almacena en memoria
   * para ser enviado junto con el formulario.
   */
  onFileChange: (file: File | undefined) => void
  disabled?: boolean
  hint?: string
  maxSizeMB?: number
  /**
   * Indica si hay un error externo (por ejemplo, validación del formulario padre)
   */
  hasError?: boolean
}

/**
 * Componente para selección de documentos
 * 
 * IMPORTANTE: Este componente NO sube archivos inmediatamente.
 * Solo almacena el archivo en memoria y lo expone al padre via onFileChange.
 * El formulario padre es responsable de enviar el archivo junto con los demás datos.
 * 
 * Esto permite:
 * - Guardado atómico (todos los documentos se envían juntos)
 * - Rollback si falla alguna subida
 * - Mejor UX (el usuario no espera por cada documento individualmente)
 */
export function DocumentUpload({
  label,
  accept,
  documentType,
  currentFile,
  onFileChange,
  disabled = false,
  hint,
  maxSizeMB = 10,
  hasError = false,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>(currentFile)
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) {
      return
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`)
      return
    }

    // Validar formato
    const extension = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = accept
      .split(",")
      .map((ext) => ext.trim().replace(".", "").toLowerCase())

    if (extension && !allowedExtensions.includes(extension)) {
      setError(`Formato no permitido. Use: ${allowedExtensions.join(", ").toUpperCase()}`)
      return
    }

    // Almacenar archivo en memoria (NO subir)
    setSelectedFileName(file.name)
    setSelectedFile(file)
    onFileChange(file)

    // Limpiar input para permitir seleccionar el mismo archivo
    event.target.value = ""
  }

  const handleRemove = () => {
    setSelectedFileName(undefined)
    setSelectedFile(undefined)
    setError(null)
    onFileChange(undefined)
  }

  // Determinar si mostrar como "ya guardado" (currentFile existe y no hay nuevo archivo seleccionado)
  const isExistingFile = !!currentFile && !selectedFile

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        data-document-type={documentType}
      />

      {selectedFileName ? (
        // Archivo seleccionado o existente
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-lg border",
          isExistingFile 
            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
            : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
        )}>
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            isExistingFile 
              ? "bg-green-100 dark:bg-green-900/50" 
              : "bg-blue-100 dark:bg-blue-900/50"
          )}>
            {isExistingFile ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFileName}</p>
            <p className="text-xs text-muted-foreground">
              {isExistingFile 
                ? "Documento guardado" 
                : "Listo para enviar con el formulario"}
            </p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleRemove}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Eliminar archivo</span>
            </Button>
          )}
        </div>
      ) : (
        // Zona de carga
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "w-full p-6 border-2 border-dashed rounded-lg transition-colors",
            "flex flex-col items-center gap-2 text-center",
            "hover:border-primary/50 hover:bg-muted/50",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent",
            (error || hasError) && "border-destructive"
          )}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-full">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Haz clic para seleccionar {label.toLowerCase()}
            </p>
            {hint && (
              <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Tamaño máximo: {maxSizeMB}MB
            </p>
          </div>
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
