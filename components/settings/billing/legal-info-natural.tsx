"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocumentUpload } from "./document-upload"
import type { NaturalPersonLegalInfo, DocumentType } from "@/lib/types/billing/types"
import { DOCUMENT_TYPES, ALLOWED_FILE_FORMATS } from "@/lib/types/billing/types"

interface LegalInfoNaturalProps {
  value: Partial<NaturalPersonLegalInfo>
  onChange: (value: Partial<NaturalPersonLegalInfo>) => void
  onFileChange: (fileName: string | undefined) => void
  errors?: Partial<Record<keyof NaturalPersonLegalInfo, string>>
  disabled?: boolean
}

/**
 * Formulario de información legal para Persona Natural
 * 
 * Campos obligatorios:
 * - Nombre completo
 * - Tipo de documento
 * - Número de documento
 * - Dirección fiscal
 * - Copia de cédula (RN-03)
 */
export function LegalInfoNatural({
  value,
  onChange,
  onFileChange,
  errors = {},
  disabled = false,
}: LegalInfoNaturalProps) {
  const updateField = <K extends keyof NaturalPersonLegalInfo>(
    field: K,
    fieldValue: NaturalPersonLegalInfo[K]
  ) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre completo */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="fullName">
            Nombre Completo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Ingresa tu nombre completo"
            value={value.fullName || ""}
            onChange={(e) => updateField("fullName", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>

        {/* Tipo de documento */}
        <div className="space-y-2">
          <Label htmlFor="documentType">
            Tipo de Documento <span className="text-destructive">*</span>
          </Label>
          <Select
            value={value.documentType || ""}
            onValueChange={(val) => updateField("documentType", val as DocumentType)}
            disabled={disabled}
          >
            <SelectTrigger id="documentType" aria-invalid={!!errors.documentType}>
              <SelectValue placeholder="Selecciona tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.documentType && (
            <p className="text-sm text-destructive">{errors.documentType}</p>
          )}
        </div>

        {/* Número de documento */}
        <div className="space-y-2">
          <Label htmlFor="documentNumber">
            Número de Documento <span className="text-destructive">*</span>
          </Label>
          <Input
            id="documentNumber"
            placeholder="Ingresa tu número de documento"
            value={value.documentNumber || ""}
            onChange={(e) => updateField("documentNumber", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.documentNumber}
          />
          {errors.documentNumber && (
            <p className="text-sm text-destructive">{errors.documentNumber}</p>
          )}
        </div>

        {/* Dirección fiscal */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="fiscalAddress">
            Dirección Fiscal <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fiscalAddress"
            placeholder="Ingresa tu dirección fiscal completa"
            value={value.fiscalAddress || ""}
            onChange={(e) => updateField("fiscalAddress", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.fiscalAddress}
          />
          {errors.fiscalAddress && (
            <p className="text-sm text-destructive">{errors.fiscalAddress}</p>
          )}
        </div>

        {/* Copia de cédula */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            Copia de Cédula <span className="text-destructive">*</span>
          </Label>
          <DocumentUpload
            label="Cédula de identidad"
            accept={ALLOWED_FILE_FORMATS.idDocument.map((f) => `.${f}`).join(",")}
            currentFile={value.idDocumentUrl}
            onFileSelect={onFileChange}
            disabled={disabled}
            hint={`Formatos permitidos: ${ALLOWED_FILE_FORMATS.idDocument.join(", ").toUpperCase()}`}
          />
          {errors.idDocumentUrl && (
            <p className="text-sm text-destructive">{errors.idDocumentUrl}</p>
          )}
        </div>
      </div>
    </div>
  )
}

