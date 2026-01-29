"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { VISUAL_MODES, PERSONALIZATION_MODULES_CONFIG } from "@/lib/types/product/types"
import type { ProductCategory, VisualMode, PersonalizationModuleCode } from "@/lib/types/product/types"

interface CategorySelectorProps {
  categories: ProductCategory[]
  selectedCategoryId?: string
  disabled?: boolean
  error?: string
  onChange: (categoryId: string) => void
}

/**
 * Selector de categoría de producto
 * Muestra las categorías disponibles con sus módulos y modos visuales permitidos
 */
export function CategorySelector({
  categories,
  selectedCategoryId,
  disabled = false,
  error,
  onChange,
}: CategorySelectorProps) {
  const getVisualModeLabel = (mode: VisualMode) => {
    return VISUAL_MODES.find(m => m.id === mode)?.name || mode
  }

  const getModuleLabel = (code: PersonalizationModuleCode) => {
    return PERSONALIZATION_MODULES_CONFIG[code]?.label || code
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedCategoryId}
        onValueChange={onChange}
        disabled={disabled}
        className="grid gap-4"
      >
        {categories.map((category) => (
          <div key={category.id} className="relative">
            <RadioGroupItem
              value={category.id}
              id={`category-${category.id}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`category-${category.id}`}
              className="flex flex-col gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{category.name}</span>
                {selectedCategoryId === category.id && (
                  <Badge variant="default">Seleccionada</Badge>
                )}
              </div>
              
              {category.description && (
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 text-xs">
                {/* Módulos permitidos */}
                <div>
                  <span className="text-muted-foreground">Personalización:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {category.allowedModules.length > 0 ? (
                      category.allowedModules.map((module) => (
                        <Badge key={module} variant="secondary" className="text-xs">
                          {getModuleLabel(module)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground italic">Sin personalización</span>
                    )}
                  </div>
                </div>
                
                {/* Modos visuales permitidos */}
                <div>
                  <span className="text-muted-foreground">Modos de imagen:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {category.allowedVisualModes.map((mode) => (
                      <Badge key={mode} variant="outline" className="text-xs">
                        {getVisualModeLabel(mode)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
