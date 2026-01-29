"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MAX_PRODUCT_NAME_LENGTH, MAX_PRODUCT_DESCRIPTION_LENGTH } from "@/lib/types/product/types"

interface BasicInfoSectionProps {
  name: string
  description: string
  basePrice?: number
  disabled?: boolean
  errors?: {
    name?: string
    description?: string
    basePrice?: string
  }
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onBasePriceChange: (price: number | undefined) => void
}

/**
 * Sección de información básica del producto
 * Nombre, descripción y precio base
 */
export function BasicInfoSection({
  name,
  description,
  basePrice,
  disabled = false,
  errors = {},
  onNameChange,
  onDescriptionChange,
  onBasePriceChange,
}: BasicInfoSectionProps) {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      onBasePriceChange(undefined)
    } else {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        onBasePriceChange(numValue)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="product-name">
          Nombre del producto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Camiseta Local Tigres FC 2026"
          maxLength={MAX_PRODUCT_NAME_LENGTH}
          disabled={disabled}
          className={errors.name ? "border-destructive" : ""}
        />
        <div className="flex justify-between text-xs">
          <span className={errors.name ? "text-destructive" : "text-muted-foreground"}>
            {errors.name || "Nombre visible para los compradores"}
          </span>
          <span className="text-muted-foreground">
            {name.length}/{MAX_PRODUCT_NAME_LENGTH}
          </span>
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="product-description">Descripción</Label>
        <Textarea
          id="product-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe el producto, materiales, características especiales..."
          maxLength={MAX_PRODUCT_DESCRIPTION_LENGTH}
          disabled={disabled}
          rows={3}
          className={errors.description ? "border-destructive" : ""}
        />
        <div className="flex justify-between text-xs">
          <span className={errors.description ? "text-destructive" : "text-muted-foreground"}>
            {errors.description || "Descripción opcional del producto"}
          </span>
          <span className="text-muted-foreground">
            {description.length}/{MAX_PRODUCT_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      {/* Precio base */}
      <div className="space-y-2">
        <Label htmlFor="product-price">
          Precio base <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="product-price"
            type="number"
            value={basePrice ?? ""}
            onChange={handlePriceChange}
            placeholder="0"
            min={1}
            step={1}
            disabled={disabled}
            className={`pl-7 ${errors.basePrice ? "border-destructive" : ""}`}
          />
        </div>
        <p className={`text-xs ${errors.basePrice ? "text-destructive" : "text-muted-foreground"}`}>
          {errors.basePrice || "Precio en pesos colombianos (COP). En el MVP no hay recargos por personalización."}
        </p>
      </div>
    </div>
  )
}
