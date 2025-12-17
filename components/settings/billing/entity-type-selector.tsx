"use client"

import { Building2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EntityType } from "@/lib/types/billing/types"

interface EntityTypeSelectorProps {
  value: EntityType | null
  onChange: (value: EntityType) => void
  disabled?: boolean
  locked?: boolean
}

/**
 * Selector de tipo de entidad (Persona Natural / Persona Jurídica)
 * 
 * RN-01: El tipo de entidad solo puede seleccionarse una vez.
 * Después de guardar, queda bloqueado.
 */
export function EntityTypeSelector({
  value,
  onChange,
  disabled = false,
  locked = false,
}: EntityTypeSelectorProps) {
  const options = [
    {
      id: "natural" as EntityType,
      label: "Persona Natural",
      description: "Actúo a título personal",
      icon: User,
    },
    {
      id: "legal" as EntityType,
      label: "Persona Jurídica",
      description: "Represento una empresa",
      icon: Building2,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Tipo de Entidad <span className="text-destructive">*</span>
        </label>
        {locked && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Bloqueado - Contacta a Soporte para cambiar
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = value === option.id
          const Icon = option.icon
          const isDisabled = disabled || (locked && !isSelected)

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !isDisabled && onChange(option.id)}
              disabled={isDisabled}
              className={cn(
                "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                isDisabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

