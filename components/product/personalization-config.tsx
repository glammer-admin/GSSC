"use client"

import { useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  PERSONALIZATION_MODULES_CONFIG,
  DEFAULT_SIZE_OPTIONS,
  DEFAULT_AGE_CATEGORY_OPTIONS,
  DEFAULT_NUMBERS_CONFIG,
  DEFAULT_NAMES_CONFIG,
  createDefaultModuleConfig,
} from "@/lib/types/product/types"
import type {
  ProductCategory,
  PersonalizationModule,
  PersonalizationConfig as PersonalizationConfigType,
  PersonalizationModuleCode,
  SizesConfig,
  NumbersConfig,
  NamesConfig,
  AgeCategoriesConfig,
} from "@/lib/types/product/types"

interface PersonalizationConfigProps {
  category: ProductCategory
  modules: PersonalizationModule[]
  config: PersonalizationConfigType
  disabled?: boolean
  error?: string
  onChange: (config: PersonalizationConfigType) => void
}

/**
 * Configurador de módulos de personalización
 * Permite habilitar/deshabilitar módulos y configurar sus opciones
 */
export function PersonalizationConfig({
  category,
  modules,
  config,
  disabled = false,
  error,
  onChange,
}: PersonalizationConfigProps) {
  // Filtrar módulos permitidos por la categoría
  const allowedModules = modules.filter(m => 
    category.allowedModules.includes(m.code)
  )

  const handleModuleToggle = useCallback((moduleCode: PersonalizationModuleCode, enabled: boolean) => {
    const newConfig = { ...config }
    
    if (enabled) {
      // Crear configuración por defecto para el módulo
      newConfig[moduleCode] = createDefaultModuleConfig(moduleCode) as SizesConfig & NumbersConfig & NamesConfig & AgeCategoriesConfig
    } else {
      // Deshabilitar módulo
      if (newConfig[moduleCode]) {
        newConfig[moduleCode] = { ...newConfig[moduleCode], enabled: false } as SizesConfig & NumbersConfig & NamesConfig & AgeCategoriesConfig
      }
    }
    
    onChange(newConfig)
  }, [config, onChange])

  const handleSizeOptionToggle = useCallback((option: string, checked: boolean) => {
    const sizesConfig = config.sizes as SizesConfig | undefined
    const currentOptions = sizesConfig?.options || []
    
    const newOptions = checked
      ? [...currentOptions, option]
      : currentOptions.filter(o => o !== option)
    
    onChange({
      ...config,
      sizes: {
        ...sizesConfig,
        enabled: true,
        options: newOptions,
        price_modifier: 0,
      },
    })
  }, [config, onChange])

  const handleAgeCategoryToggle = useCallback((option: string, checked: boolean) => {
    const ageCategoriesConfig = config.age_categories as AgeCategoriesConfig | undefined
    const currentOptions = ageCategoriesConfig?.options || []
    
    const newOptions = checked
      ? [...currentOptions, option]
      : currentOptions.filter(o => o !== option)
    
    onChange({
      ...config,
      age_categories: {
        ...ageCategoriesConfig,
        enabled: true,
        options: newOptions,
        price_modifier: 0,
      },
    })
  }, [config, onChange])

  const handleNumbersChange = useCallback((field: "min" | "max", value: number) => {
    const numbersConfig = config.numbers as NumbersConfig | undefined
    
    onChange({
      ...config,
      numbers: {
        ...numbersConfig,
        enabled: true,
        min: field === "min" ? value : (numbersConfig?.min ?? DEFAULT_NUMBERS_CONFIG.min),
        max: field === "max" ? value : (numbersConfig?.max ?? DEFAULT_NUMBERS_CONFIG.max),
        price_modifier: 0,
      },
    })
  }, [config, onChange])

  const handleNamesChange = useCallback((maxLength: number) => {
    const namesConfig = config.names as NamesConfig | undefined
    
    onChange({
      ...config,
      names: {
        ...namesConfig,
        enabled: true,
        max_length: maxLength,
        price_modifier: 0,
      },
    })
  }, [config, onChange])

  if (allowedModules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Esta categoría no permite opciones de personalización.</p>
        <p className="text-sm mt-2">El producto se venderá tal como fue definido.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {allowedModules.map((module) => {
        const moduleConfig = config[module.code]
        const isEnabled = moduleConfig?.enabled ?? false
        const moduleInfo = PERSONALIZATION_MODULES_CONFIG[module.code]

        return (
          <div key={module.code} className="border rounded-lg p-4 space-y-4">
            {/* Header del módulo */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {moduleInfo.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {moduleInfo.description}
                </p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleModuleToggle(module.code, checked)}
                disabled={disabled}
              />
            </div>

            {/* Configuración específica del módulo */}
            {isEnabled && (
              <div className="pt-4 border-t">
                {/* Configuración de tallas */}
                {module.code === "sizes" && (
                  <div className="space-y-3">
                    <Label className="text-sm">Tallas disponibles:</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_SIZE_OPTIONS.map((size) => {
                        const sizesConfig = config.sizes as SizesConfig | undefined
                        const isSelected = sizesConfig?.options?.includes(size) ?? false
                        
                        return (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox
                              id={`size-${size}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleSizeOptionToggle(size, checked as boolean)
                              }
                              disabled={disabled}
                            />
                            <Label htmlFor={`size-${size}`} className="text-sm cursor-pointer">
                              {size}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Configuración de números */}
                {module.code === "numbers" && (
                  <div className="space-y-3">
                    <Label className="text-sm">Rango de números permitido:</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="numbers-min" className="text-sm">Mínimo:</Label>
                        <Input
                          id="numbers-min"
                          type="number"
                          min={1}
                          max={99}
                          value={(config.numbers as NumbersConfig)?.min ?? DEFAULT_NUMBERS_CONFIG.min}
                          onChange={(e) => handleNumbersChange("min", parseInt(e.target.value) || 1)}
                          disabled={disabled}
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="numbers-max" className="text-sm">Máximo:</Label>
                        <Input
                          id="numbers-max"
                          type="number"
                          min={1}
                          max={99}
                          value={(config.numbers as NumbersConfig)?.max ?? DEFAULT_NUMBERS_CONFIG.max}
                          onChange={(e) => handleNumbersChange("max", parseInt(e.target.value) || 99)}
                          disabled={disabled}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuración de nombres */}
                {module.code === "names" && (
                  <div className="space-y-3">
                    <Label htmlFor="names-length" className="text-sm">
                      Longitud máxima del nombre:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="names-length"
                        type="number"
                        min={1}
                        max={30}
                        value={(config.names as NamesConfig)?.max_length ?? DEFAULT_NAMES_CONFIG.max_length}
                        onChange={(e) => handleNamesChange(parseInt(e.target.value) || 15)}
                        disabled={disabled}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">caracteres</span>
                    </div>
                  </div>
                )}

                {/* Configuración de categorías de edad */}
                {module.code === "age_categories" && (
                  <div className="space-y-3">
                    <Label className="text-sm">Categorías disponibles:</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_AGE_CATEGORY_OPTIONS.map((category) => {
                        const ageCategoriesConfig = config.age_categories as AgeCategoriesConfig | undefined
                        const isSelected = ageCategoriesConfig?.options?.includes(category) ?? false
                        
                        return (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`age-${category}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleAgeCategoryToggle(category, checked as boolean)
                              }
                              disabled={disabled}
                            />
                            <Label htmlFor={`age-${category}`} className="text-sm cursor-pointer capitalize">
                              {category}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
