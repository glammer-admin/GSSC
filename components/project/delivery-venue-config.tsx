"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DELIVERY_PERIODICITIES } from "@/lib/types/project/types"
import type { DeliveryPeriodicity, VenueDeliveryConfig } from "@/lib/types/project/types"

interface DeliveryVenueConfigProps {
  config: VenueDeliveryConfig
  disabled?: boolean
  errors?: {
    address?: string
    periodicity?: string
  }
  onChange: (config: VenueDeliveryConfig) => void
}

/**
 * Configuración de entrega en sede del organizador
 */
export function DeliveryVenueConfig({
  config,
  disabled,
  errors,
  onChange,
}: DeliveryVenueConfigProps) {
  if (!config.enabled) return null
  
  return (
    <div className="pl-8 space-y-4 border-l-2 border-muted ml-2">
      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="venueAddress">
          Dirección de entrega <span className="text-destructive">*</span>
        </Label>
        <Input
          id="venueAddress"
          value={config.address || ""}
          onChange={(e) => onChange({ ...config, address: e.target.value })}
          placeholder="Ej: Calle 100 #15-20, Bogotá"
          disabled={disabled}
          className={errors?.address ? "border-destructive" : ""}
        />
        {errors?.address && (
          <p className="text-sm text-destructive">{errors.address}</p>
        )}
      </div>
      
      {/* Periodicidad */}
      <div className="space-y-2">
        <Label htmlFor="venuePeriodicity">
          Periodicidad de entrega <span className="text-destructive">*</span>
        </Label>
        <Select
          value={config.periodicity}
          onValueChange={(value) =>
            onChange({ ...config, periodicity: value as DeliveryPeriodicity })
          }
          disabled={disabled}
        >
          <SelectTrigger
            id="venuePeriodicity"
            className={errors?.periodicity ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Selecciona periodicidad" />
          </SelectTrigger>
          <SelectContent>
            {DELIVERY_PERIODICITIES.map((period) => (
              <SelectItem key={period.id} value={period.id}>
                {period.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.periodicity && (
          <p className="text-sm text-destructive">{errors.periodicity}</p>
        )}
      </div>
    </div>
  )
}

