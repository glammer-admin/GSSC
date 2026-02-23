"use client"

import { useCallback } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { GlamAttributeConfig, SelectedAttributes } from "@/lib/types/product/types"

interface AttributeSelectorProps {
  attributesConfig: Record<string, GlamAttributeConfig>
  selectedAttributes: SelectedAttributes
  disabled?: boolean
  onChange: (attrs: SelectedAttributes) => void
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  quality: "Calidad",
  color: "Color",
  material: "Material",
}

const OPTION_LABELS: Record<string, string> = {
  estandar: "Estándar",
  "estándar": "Estándar",
  premium: "Premium",
  blanco: "Blanco",
  negro: "Negro",
  azul: "Azul",
  rojo: "Rojo",
  ceramica: "Cerámica",
  acero_inoxidable: "Acero inoxidable",
  plastico_bpa_free: "Plástico BPA free",
}

function formatLabel(key: string): string {
  return OPTION_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
}

const fmt = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)

/**
 * Permite seleccionar los atributos de un producto del catálogo (quality, material, etc.)
 * y muestra el modificador de precio de cada opción.
 */
export function AttributeSelector({
  attributesConfig,
  selectedAttributes,
  disabled = false,
  onChange,
}: AttributeSelectorProps) {
  const entries = Object.entries(attributesConfig)

  const handleChange = useCallback(
    (attrKey: string, option: string) => {
      const modifier = attributesConfig[attrKey]?.price_modifier[option] ?? 0
      onChange({
        ...selectedAttributes,
        [attrKey]: { selected_option: option, price_modifier: modifier },
      })
    },
    [attributesConfig, selectedAttributes, onChange],
  )

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este producto no tiene atributos configurables.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map(([attrKey, cfg]) => {
        const current = selectedAttributes[attrKey]?.selected_option
        const label = ATTRIBUTE_LABELS[attrKey] ?? formatLabel(attrKey)

        return (
          <div key={attrKey} className="space-y-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            <Select
              value={current ?? ""}
              onValueChange={(val) => handleChange(attrKey, val)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Seleccionar ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {cfg.options.map((opt) => {
                  const modifier = cfg.price_modifier[opt] ?? 0
                  return (
                    <SelectItem key={opt} value={opt}>
                      {formatLabel(opt)}
                      {modifier > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          (+{fmt(modifier)})
                        </span>
                      )}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {current && (cfg.price_modifier[current] ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                Recargo: +{fmt(cfg.price_modifier[current])}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
