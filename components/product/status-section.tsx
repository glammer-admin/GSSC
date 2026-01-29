"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import {
  PRODUCT_STATUS_CONFIG,
  VALID_PRODUCT_STATUS_TRANSITIONS,
  MIN_IMAGES_FOR_ACTIVATION,
} from "@/lib/types/product/types"
import type { ProductStatus } from "@/lib/types/product/types"

interface StatusSectionProps {
  status: ProductStatus
  imageCount: number
  disabled?: boolean
  error?: string
  onChange: (status: ProductStatus) => void
}

/**
 * Sección de estado del producto
 * Permite cambiar entre draft, active e inactive
 */
export function StatusSection({
  status,
  imageCount,
  disabled = false,
  error,
  onChange,
}: StatusSectionProps) {
  const availableTransitions = VALID_PRODUCT_STATUS_TRANSITIONS[status]
  const canActivate = imageCount >= MIN_IMAGES_FOR_ACTIVATION

  const getStatusBadgeVariant = (s: ProductStatus) => {
    switch (s) {
      case "active":
        return "default"
      case "draft":
        return "secondary"
      case "inactive":
        return "destructive"
    }
  }

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado actual:</span>
        <Badge variant={getStatusBadgeVariant(status)}>
          {PRODUCT_STATUS_CONFIG[status].label}
        </Badge>
      </div>

      {/* Advertencia si no puede activar */}
      {status === "draft" && !canActivate && (
        <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Necesitas al menos {MIN_IMAGES_FOR_ACTIVATION} imágenes para poder activar el producto.
            Actualmente tienes {imageCount}.
          </AlertDescription>
        </Alert>
      )}

      {/* Selector de estado */}
      <RadioGroup
        value={status}
        onValueChange={(value) => onChange(value as ProductStatus)}
        disabled={disabled}
        className="grid gap-3"
      >
        {(Object.keys(PRODUCT_STATUS_CONFIG) as ProductStatus[]).map((statusKey) => {
          const config = PRODUCT_STATUS_CONFIG[statusKey]
          const isCurrentStatus = status === statusKey
          const canTransition = isCurrentStatus || availableTransitions.includes(statusKey)
          const isActivationBlocked = statusKey === "active" && !canActivate && status === "draft"

          return (
            <div key={statusKey} className="flex items-start space-x-3">
              <RadioGroupItem
                value={statusKey}
                id={`status-${statusKey}`}
                disabled={!canTransition || isActivationBlocked}
              />
              <Label
                htmlFor={`status-${statusKey}`}
                className={`flex flex-col cursor-pointer ${
                  !canTransition || isActivationBlocked ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.label}</span>
                  {isCurrentStatus && (
                    <Badge variant="outline" className="text-xs">
                      Actual
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {config.description}
                </span>
                {!canTransition && !isCurrentStatus && (
                  <span className="text-xs text-amber-600 mt-1">
                    No disponible desde el estado actual
                  </span>
                )}
                {isActivationBlocked && (
                  <span className="text-xs text-amber-600 mt-1">
                    Requiere mínimo {MIN_IMAGES_FOR_ACTIVATION} imágenes
                  </span>
                )}
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      {/* Información sobre transiciones */}
      {status !== "draft" && (
        <p className="text-xs text-muted-foreground">
          {status === "active" && "Puedes desactivar el producto para que deje de estar visible en la tienda."}
          {status === "inactive" && "Puedes reactivar el producto para que vuelva a estar visible en la tienda."}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
