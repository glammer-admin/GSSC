"use client"

import { useRef, useState } from "react"
import { Upload, File, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DocumentUploadProps {
  label: string
  accept: string
  currentFile?: string
  onFileSelect: (fileName: string | undefined) => void
  disabled?: boolean
  hint?: string
  maxSizeMB?: number
}

/**
 * Componente placeholder para carga de documentos
 * 
 * NOTA: Esta es una implementación mock/placeholder.
 * No realiza carga real de archivos a storage.
 * Solo simula la selección y muestra el nombre del archivo.
 */
export function DocumentUpload({
  label,
  accept,
  currentFile,
  onFileSelect,
  disabled = false,
  hint,
  maxSizeMB = 5,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>(currentFile)

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

    // Simular selección exitosa (mock - no hay upload real)
    setSelectedFileName(file.name)
    onFileSelect(file.name)

    // Limpiar input para permitir seleccionar el mismo archivo
    event.target.value = ""
  }

  const handleRemove = () => {
    setSelectedFileName(undefined)
    setError(null)
    onFileSelect(undefined)
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {selectedFileName ? (
        // Archivo seleccionado
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <File className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFileName}</p>
            <p className="text-xs text-muted-foreground">
              {label} • Archivo seleccionado
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
            error && "border-destructive"
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

