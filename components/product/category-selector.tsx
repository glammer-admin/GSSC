"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProductCategory } from "@/lib/types/product/types"

interface CategorySelectorProps {
  categories: ProductCategory[]
  selectedCategoryId?: string
  disabled?: boolean
  error?: string
  onChange: (categoryId: string) => void
}

/**
 * Selector de categoría de producto.
 * Muestra solo el nombre de cada categoría; los módulos y modos visuales
 * se configuran después en sus propias secciones.
 */
export function CategorySelector({
  categories,
  selectedCategoryId,
  disabled = false,
  error,
  onChange,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>
        Categoría del producto <span className="text-destructive">*</span>
      </Label>
      <Select
        value={selectedCategoryId ?? ""}
        onValueChange={(value) => value && onChange(value)}
        disabled={disabled}
      >
        <SelectTrigger
          className={`w-full max-w-sm ${error ? "border-destructive" : ""}`}
        >
          <SelectValue placeholder="Elige una categoría" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
