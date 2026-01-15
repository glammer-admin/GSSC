"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, Truck, MapPin } from "lucide-react"
import { DeliveryVenueConfig } from "./delivery-venue-config"
import { DeliveryHomeConfig } from "./delivery-home-config"
import { DeliveryPickupConfig } from "./delivery-pickup-config"
import { DELIVERY_TYPES } from "@/lib/types/project/types"
import type { 
  DeliveryType, 
  DeliveryConfig,
  OrganizerLocationConfig,
  CustomerHomeConfig,
} from "@/lib/types/project/types"

interface DeliveryModesSectionProps {
  deliveryType: DeliveryType | undefined
  deliveryConfig: DeliveryConfig
  disabled?: boolean
  errors?: {
    general?: string
    venue?: {
      address?: string
      periodicity?: string
    }
    home?: {
      feeType?: string
    }
  }
  onDeliveryTypeChange: (type: DeliveryType) => void
  onDeliveryConfigChange: (config: DeliveryConfig) => void
}

const DELIVERY_ICONS = {
  organizer_location: Building2,
  customer_home: Truck,
  glam_urban_pickup: MapPin,
}

const DELIVERY_DESCRIPTIONS = {
  organizer_location: "Los productos se entregan en tu ubicación",
  customer_home: "Envío directo a la dirección del cliente",
  glam_urban_pickup: "Recoges los productos en nuestras instalaciones",
}

/**
 * Sección de configuración de modo de entrega
 * 
 * Selección única (radio buttons) entre:
 * - Ubicación del organizador
 * - Domicilio del cliente
 * - Punto de retiro Glam Urban
 */
export function DeliveryModesSection({
  deliveryType,
  deliveryConfig,
  disabled,
  errors,
  onDeliveryTypeChange,
  onDeliveryConfigChange,
}: DeliveryModesSectionProps) {
  
  const handleTypeChange = (value: string) => {
    const newType = value as DeliveryType
    onDeliveryTypeChange(newType)
    
    // Limpiar configuración al cambiar de tipo
    if (newType === "organizer_location") {
      onDeliveryConfigChange({ address: "", periodicity: "weekly" })
    } else if (newType === "customer_home") {
      onDeliveryConfigChange({ delivery_fee_type: "charged_to_customer" })
    } else {
      onDeliveryConfigChange(null)
    }
  }
  
  const handleVenueConfigChange = (config: OrganizerLocationConfig) => {
    onDeliveryConfigChange(config)
  }
  
  const handleHomeConfigChange = (config: CustomerHomeConfig) => {
    onDeliveryConfigChange(config)
  }
  
  // Type guards para la configuración
  const isOrganizerLocationConfig = (config: DeliveryConfig): config is OrganizerLocationConfig => {
    return config !== null && "address" in config
  }
  
  const isCustomerHomeConfig = (config: DeliveryConfig): config is CustomerHomeConfig => {
    return config !== null && "delivery_fee_type" in config
  }
  
  return (
    <div className="space-y-6">
      {/* Error general */}
      {errors?.general && (
        <p className="text-sm text-destructive">{errors.general}</p>
      )}
      
      <RadioGroup
        value={deliveryType}
        onValueChange={handleTypeChange}
        disabled={disabled}
        className="space-y-4"
      >
        {DELIVERY_TYPES.map((type) => {
          const Icon = DELIVERY_ICONS[type.id]
          const description = DELIVERY_DESCRIPTIONS[type.id]
          const isSelected = deliveryType === type.id
          
          return (
            <div key={type.id} className="space-y-4">
              <div className="flex items-start space-x-3">
                <RadioGroupItem
                  value={type.id}
                  id={type.id}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={type.id} className="cursor-pointer font-medium">
                      {type.name}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {description}
                  </p>
                </div>
              </div>
              
              {/* Configuración específica según tipo seleccionado */}
              {isSelected && type.id === "organizer_location" && (
                <div className="ml-6 pl-4 border-l-2 border-muted">
                  <DeliveryVenueConfig
                    config={isOrganizerLocationConfig(deliveryConfig) ? deliveryConfig : { address: "", periodicity: "weekly" }}
                    disabled={disabled}
                    errors={errors?.venue}
                    onChange={handleVenueConfigChange}
                  />
                </div>
              )}
              
              {isSelected && type.id === "customer_home" && (
                <div className="ml-6 pl-4 border-l-2 border-muted">
                  <DeliveryHomeConfig
                    config={isCustomerHomeConfig(deliveryConfig) ? deliveryConfig : { delivery_fee_type: "charged_to_customer" }}
                    disabled={disabled}
                    error={errors?.home?.feeType}
                    onChange={handleHomeConfigChange}
                  />
                </div>
              )}
              
              {isSelected && type.id === "glam_urban_pickup" && (
                <div className="ml-6 pl-4 border-l-2 border-muted">
                  <DeliveryPickupConfig />
                </div>
              )}
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}
