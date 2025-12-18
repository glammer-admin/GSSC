"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Package } from "lucide-react"

interface PackagingSectionProps {
  customPackaging: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}

/**
 * Sección de configuración de packaging personalizado
 */
export function PackagingSection({
  customPackaging,
  disabled,
  onChange,
}: PackagingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label htmlFor="customPackaging" className="cursor-pointer">
              Packaging personalizado
            </Label>
            <p className="text-xs text-muted-foreground">
              Empaquetado con branding del proyecto
            </p>
          </div>
        </div>
        <Switch
          id="customPackaging"
          checked={customPackaging}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
      
      <p className="text-xs text-muted-foreground">
        Esta opción afecta el costo y precio publicado de los productos.
        El cambio solo aplica a nuevos productos.
      </p>
    </div>
  )
}

