"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DELIVERY_FEE_TYPES } from "@/lib/types/project/types"
import type { DeliveryFeeType, CustomerHomeConfig } from "@/lib/types/project/types"

interface DeliveryHomeConfigProps {
  config: CustomerHomeConfig
  disabled?: boolean
  error?: string
  onChange: (config: CustomerHomeConfig) => void
}

/**
 * Configuración de entrega a domicilio del cliente
 */
export function DeliveryHomeConfig({
  config,
  disabled,
  error,
  onChange,
}: DeliveryHomeConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>
          Tipo de costo <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={config.delivery_fee_type}
          onValueChange={(value) =>
            onChange({ ...config, delivery_fee_type: value as DeliveryFeeType })
          }
          disabled={disabled}
          className="space-y-2"
        >
          {DELIVERY_FEE_TYPES.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <RadioGroupItem value={type.id} id={`home-cost-${type.id}`} />
              <Label
                htmlFor={`home-cost-${type.id}`}
                className="font-normal cursor-pointer"
              >
                {type.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
      
      {/* Información según tipo seleccionado */}
      {config.delivery_fee_type === "charged_to_customer" && (
        <p className="text-xs text-muted-foreground">
          El costo del envío se calculará según la ubicación del comprador.
        </p>
      )}
      
      {config.delivery_fee_type === "included_in_price" && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            El costo del envío está incluido en el precio del producto.
            Esto reduce la ganancia del organizador.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
