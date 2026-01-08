"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Building2, Truck, MapPin } from "lucide-react"
import { DeliveryVenueConfig } from "./delivery-venue-config"
import { DeliveryHomeConfig } from "./delivery-home-config"
import { DeliveryPickupConfig } from "./delivery-pickup-config"
import type { DeliveryModes, VenueDeliveryConfig, HomeDeliveryConfig, PickupDeliveryConfig } from "@/lib/types/project/types"

interface DeliveryModesSectionProps {
  deliveryModes: DeliveryModes
  disabled?: boolean
  errors?: {
    general?: string
    venue?: {
      address?: string
      periodicity?: string
    }
    home?: {
      costType?: string
    }
  }
  onChange: (modes: DeliveryModes) => void
}

/**
 * Sección de configuración de modos de entrega
 * 
 * Incluye:
 * - Entrega en sede del organizador
 * - Entrega a domicilio del comprador
 * - Recolección en Glam Urban
 */
export function DeliveryModesSection({
  deliveryModes,
  disabled,
  errors,
  onChange,
}: DeliveryModesSectionProps) {
  const handleVenueToggle = (enabled: boolean) => {
    const newConfig: VenueDeliveryConfig = enabled
      ? { enabled: true, address: "", periodicity: undefined }
      : { enabled: false }
    onChange({ ...deliveryModes, venue: newConfig })
  }
  
  const handleHomeToggle = (enabled: boolean) => {
    const newConfig: HomeDeliveryConfig = enabled
      ? { enabled: true, costType: undefined }
      : { enabled: false }
    onChange({ ...deliveryModes, home: newConfig })
  }
  
  const handlePickupToggle = (enabled: boolean) => {
    const newConfig: PickupDeliveryConfig = { enabled }
    onChange({ ...deliveryModes, pickup: newConfig })
  }
  
  const handleVenueConfigChange = (config: VenueDeliveryConfig) => {
    onChange({ ...deliveryModes, venue: config })
  }
  
  const handleHomeConfigChange = (config: HomeDeliveryConfig) => {
    onChange({ ...deliveryModes, home: config })
  }
  
  return (
    <div className="space-y-6">
      {/* Error general */}
      {errors?.general && (
        <p className="text-sm text-destructive">{errors.general}</p>
      )}
      
      {/* Entrega en sede del organizador */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="venueDelivery" className="cursor-pointer">
                Entrega en sede del organizador
              </Label>
              <p className="text-xs text-muted-foreground">
                Los productos se entregan en tu ubicación
              </p>
            </div>
          </div>
          <Switch
            id="venueDelivery"
            checked={deliveryModes.venue.enabled}
            onCheckedChange={handleVenueToggle}
            disabled={disabled}
          />
        </div>
        
        <DeliveryVenueConfig
          config={deliveryModes.venue}
          disabled={disabled}
          errors={errors?.venue}
          onChange={handleVenueConfigChange}
        />
      </div>
      
      {/* Entrega a domicilio */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="homeDelivery" className="cursor-pointer">
                Entrega a domicilio del comprador
              </Label>
              <p className="text-xs text-muted-foreground">
                Envío directo a la dirección del cliente
              </p>
            </div>
          </div>
          <Switch
            id="homeDelivery"
            checked={deliveryModes.home.enabled}
            onCheckedChange={handleHomeToggle}
            disabled={disabled}
          />
        </div>
        
        <DeliveryHomeConfig
          config={deliveryModes.home}
          disabled={disabled}
          error={errors?.home?.costType}
          onChange={handleHomeConfigChange}
        />
      </div>
      
      {/* Recolección en Glam Urban */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="pickupDelivery" className="cursor-pointer">
                Recolección por el organizador en Glam Urban
              </Label>
              <p className="text-xs text-muted-foreground">
                Recoges los productos en nuestras instalaciones
              </p>
            </div>
          </div>
          <Switch
            id="pickupDelivery"
            checked={deliveryModes.pickup.enabled}
            onCheckedChange={handlePickupToggle}
            disabled={disabled}
          />
        </div>
        
        <DeliveryPickupConfig config={deliveryModes.pickup} />
      </div>
    </div>
  )
}

