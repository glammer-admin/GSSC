"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

/**
 * Configuración de recolección en Glam Urban
 * 
 * Solo muestra información, no requiere configuración adicional
 * delivery_config = null para este tipo
 */
export function DeliveryPickupConfig() {
  return (
    <Alert variant="default" className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 text-sm">
        Sin costo adicional. El organizador recoge los productos directamente en las instalaciones de Glam Urban.
      </AlertDescription>
    </Alert>
  )
}
