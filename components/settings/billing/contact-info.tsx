"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { ContactInfo } from "@/lib/types/billing/types"

interface ContactInfoFormProps {
  value: Partial<ContactInfo>
  onChange: (value: Partial<ContactInfo>) => void
  errors?: Partial<Record<keyof ContactInfo, string>>
  disabled?: boolean
  // Datos para autocompletado (RN-09)
  userData?: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }
  onUseProfileData?: (use: boolean) => void
  useProfileData?: boolean
  showAutoComplete?: boolean
}

/**
 * Formulario de datos de contacto financiero
 * 
 * Campos obligatorios:
 * - Email de contacto financiero
 * - Teléfono principal
 * - Dirección completa
 * 
 * RN-09: Para Persona Natural, se puede optar por autocompletar datos desde el perfil
 * RN-10: Los datos autocompletados son editables manualmente
 */
export function ContactInfoForm({
  value,
  onChange,
  errors = {},
  disabled = false,
  userData,
  onUseProfileData,
  useProfileData = false,
  showAutoComplete = false,
}: ContactInfoFormProps) {
  const updateField = <K extends keyof ContactInfo>(
    field: K,
    fieldValue: ContactInfo[K]
  ) => {
    onChange({ ...value, [field]: fieldValue })
  }

  const hasUserData = userData && (userData.email || userData.phone || userData.address)

  return (
    <div className="space-y-6">
      {/* Opción de autocompletado */}
      {showAutoComplete && hasUserData && onUseProfileData && (
        <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="useProfileData"
            checked={useProfileData}
            onCheckedChange={(checked) => onUseProfileData(checked === true)}
            disabled={disabled}
          />
          <label
            htmlFor="useProfileData"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Usar los mismos datos de mi perfil de registro
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email de contacto */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail">
            Email de Contacto Financiero <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="correo@ejemplo.com"
            value={value.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="contactPhone">
            Teléfono Principal <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="Ej: 3001234567"
            value={value.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        {/* Dirección */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="contactAddress">
            Dirección Completa <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contactAddress"
            placeholder="Ingresa tu dirección completa"
            value={value.address || ""}
            onChange={(e) => updateField("address", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.address}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  )
}

