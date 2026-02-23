"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  // Inactive state: show reactivation UI
  if (status === "inactive") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Estado actual:</span>
          <Badge variant={getStatusBadgeVariant(status)}>
            {PRODUCT_STATUS_CONFIG[status].label}
          </Badge>
        </div>

        {!canActivate && (
          <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Necesitas al menos {MIN_IMAGES_FOR_ACTIVATION} imágenes para poder reactivar el producto.
              Actualmente tienes {imageCount}.
            </AlertDescription>
          </Alert>
        )}

        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-3">
            Este producto está inactivo y no es visible en la tienda. Puedes reactivarlo para que vuelva a estar disponible.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !canActivate}
            onClick={() => onChange("active")}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reactivar producto
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado actual:</span>
        <Badge variant={getStatusBadgeVariant(status)}>
          {PRODUCT_STATUS_CONFIG[status].label}
        </Badge>
      </div>

      {status === "draft" && !canActivate && (
        <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Necesitas al menos {MIN_IMAGES_FOR_ACTIVATION} imágenes para poder activar el producto.
            Actualmente tienes {imageCount}.
          </AlertDescription>
        </Alert>
      )}

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

      {status !== "draft" && (
        <p className="text-xs text-muted-foreground">
          {status === "active" && "Puedes desactivar el producto para que deje de estar visible en la tienda."}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
