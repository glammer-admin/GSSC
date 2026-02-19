"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MAX_PRODUCT_NAME_LENGTH, MAX_PRODUCT_DESCRIPTION_LENGTH } from "@/lib/types/product/types"

interface BasicInfoSectionProps {
  name: string
  description: string
  disabled?: boolean
  errors?: {
    name?: string
    description?: string
  }
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
}

/**
 * Sección de información básica del producto: nombre y descripción.
 * El precio viene del producto del catálogo seleccionado y se muestra en Costo aproximado.
 */
export function BasicInfoSection({
  name,
  description,
  disabled = false,
  errors = {},
  onNameChange,
  onDescriptionChange,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
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
    </div>
  )
}
