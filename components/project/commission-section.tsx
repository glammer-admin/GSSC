"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CommissionSectionProps {
  commission: number | undefined
  disabled?: boolean
  error?: string
  onChange: (value: number | undefined) => void
}

/**
 * Sección de configuración de comisión del organizador
 * 
 * - Valor entero entre 0 y 100
 * - Sin decimales
 */
export function CommissionSection({
  commission,
  disabled,
  error,
  onChange,
}: CommissionSectionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (value === "") {
      onChange(undefined)
      return
    }
    
    // Solo permitir números enteros
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue)) {
      // Limitar al rango 0-100
      const clampedValue = Math.min(100, Math.max(0, numValue))
      onChange(clampedValue)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="commission">
          Comisión del organizador (%) <span className="text-destructive">*</span>
        </Label>
        <div className="relative w-32">
          <Input
            id="commission"
            type="number"
            min={0}
            max={100}
            step={1}
            value={commission ?? ""}
            onChange={handleChange}
            placeholder="0"
            disabled={disabled}
            className={`pr-8 ${error ? "border-destructive" : ""}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            %
          </span>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Porcentaje de ganancia sobre cada venta. Aplica a todos los productos del proyecto.
        </p>
      </div>
    </div>
  )
}

