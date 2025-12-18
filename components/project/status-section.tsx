"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertTriangle } from "lucide-react"
import {
  PROJECT_STATUS_CONFIG,
  getAvailableStatusTransitions,
} from "@/lib/types/project/types"
import type { ProjectStatus } from "@/lib/types/project/types"

interface StatusSectionProps {
  status: ProjectStatus
  isEditMode: boolean
  disabled?: boolean
  error?: string
  onChange: (status: ProjectStatus) => void
}

/**
 * Sección de estado del proyecto
 * 
 * En modo creación: Solo permite Borrador o Activo
 * En modo edición: Permite transiciones según el estado actual
 */
export function StatusSection({
  status,
  isEditMode,
  disabled,
  error,
  onChange,
}: StatusSectionProps) {
  // En modo creación, solo permitir draft o active
  const availableStatuses: ProjectStatus[] = isEditMode
    ? [status, ...getAvailableStatusTransitions(status)]
    : ["draft", "active"]
  
  // Proyecto finalizado no puede cambiar de estado
  const isFinished = status === "finished"
  
  const statusConfig = PROJECT_STATUS_CONFIG[status]
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">
          Estado del proyecto <span className="text-destructive">*</span>
        </Label>
        
        {isFinished ? (
          // Proyecto finalizado - mostrar como badge bloqueado
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-sm">
                {statusConfig.label}
              </Badge>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Los proyectos finalizados no pueden reactivarse
            </p>
          </div>
        ) : (
          <Select
            value={status}
            onValueChange={(value) => onChange(value as ProjectStatus)}
            disabled={disabled}
          >
            <SelectTrigger
              id="status"
              className={error ? "border-destructive" : ""}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((s) => {
                const config = PROJECT_STATUS_CONFIG[s]
                return (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          config.color === "gray"
                            ? "bg-gray-400"
                            : config.color === "green"
                            ? "bg-green-500"
                            : config.color === "yellow"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                      {config.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
      
      {/* Descripción del estado actual */}
      <p className="text-xs text-muted-foreground">
        {statusConfig.description}
      </p>
      
      {/* Advertencia al activar en creación */}
      {!isEditMode && status === "active" && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Al activar el proyecto, será visible en la tienda pública.
            Asegúrate de completar toda la información obligatoria.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

