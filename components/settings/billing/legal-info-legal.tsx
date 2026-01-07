"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocumentUpload } from "./document-upload"
import type { LegalEntityLegalInfo } from "@/lib/types/billing/types"
import { ALLOWED_FILE_FORMATS } from "@/lib/types/billing/types"

interface LegalInfoLegalProps {
  value: Partial<LegalEntityLegalInfo>
  onChange: (value: Partial<LegalEntityLegalInfo>) => void
  /**
   * Callback cuando se selecciona o elimina el archivo RUT.
   * Recibe el objeto File o undefined si se elimina.
   * El archivo se enviará junto con el formulario al guardar.
   */
  onFileChange: (file: File | undefined) => void
  errors?: Partial<Record<keyof LegalEntityLegalInfo, string>>
  disabled?: boolean
}

/**
 * Formulario de información legal para Persona Jurídica
 * 
 * Campos obligatorios:
 * - Razón social
 * - NIT (9-10 dígitos)
 * - Dirección fiscal
 * - RUT (RN-06)
 * 
 * NOTA: El documento NO se sube inmediatamente. Se almacena en memoria
 * y se envía junto con el formulario al guardar (RN-22).
 */
export function LegalInfoLegal({
  value,
  onChange,
  onFileChange,
  errors = {},
  disabled = false,
}: LegalInfoLegalProps) {
  const updateField = <K extends keyof LegalEntityLegalInfo>(
    field: K,
    fieldValue: LegalEntityLegalInfo[K]
  ) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Razón social */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessName">
            Razón Social <span className="text-destructive">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder="Ingresa la razón social de la empresa"
            value={value.businessName || ""}
            onChange={(e) => updateField("businessName", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.businessName}
          />
          {errors.businessName && (
            <p className="text-sm text-destructive">{errors.businessName}</p>
          )}
        </div>

        {/* NIT */}
        <div className="space-y-2">
          <Label htmlFor="nit">
            NIT <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nit"
            placeholder="Ingresa el NIT (9-10 dígitos)"
            value={value.nit || ""}
            onChange={(e) => updateField("nit", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.nit}
          />
          <p className="text-xs text-muted-foreground">
            El NIT debe tener entre 9 y 10 dígitos
          </p>
          {errors.nit && (
            <p className="text-sm text-destructive">{errors.nit}</p>
          )}
        </div>

        {/* Dirección fiscal */}
        <div className="space-y-2">
          <Label htmlFor="fiscalAddress">
            Dirección Fiscal <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fiscalAddress"
            placeholder="Ingresa la dirección fiscal de la empresa"
            value={value.fiscalAddress || ""}
            onChange={(e) => updateField("fiscalAddress", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.fiscalAddress}
          />
          {errors.fiscalAddress && (
            <p className="text-sm text-destructive">{errors.fiscalAddress}</p>
          )}
        </div>

        {/* RUT */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            RUT (Registro Único Tributario) <span className="text-destructive">*</span>
          </Label>
          <DocumentUpload
            label="Documento RUT"
            accept={ALLOWED_FILE_FORMATS.rut.map((f) => `.${f}`).join(",")}
            documentType="rut"
            currentFile={value.rutDocumentUrl}
            onFileChange={onFileChange}
            disabled={disabled}
            hint={`Solo formato: ${ALLOWED_FILE_FORMATS.rut.join(", ").toUpperCase()}`}
            hasError={!!errors.rutDocumentUrl}
          />
          {errors.rutDocumentUrl && (
            <p className="text-sm text-destructive">{errors.rutDocumentUrl}</p>
          )}
        </div>
      </div>
    </div>
  )
}
