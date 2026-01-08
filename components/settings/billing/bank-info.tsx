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
import type { BankInfo, AccountType } from "@/lib/types/billing/types"
import {
  COLOMBIAN_BANKS,
  ACCOUNT_TYPES,
  ALLOWED_FILE_FORMATS,
} from "@/lib/types/billing/types"

interface BankInfoFormProps {
  value: Partial<BankInfo>
  onChange: (value: Partial<BankInfo>) => void
  /**
   * Callback cuando se selecciona o elimina la certificación bancaria.
   * Recibe el objeto File o undefined si se elimina.
   * El archivo se enviará junto con el formulario al guardar.
   */
  onFileChange: (file: File | undefined) => void
  errors?: Partial<Record<keyof BankInfo, string>>
  disabled?: boolean
}

/**
 * Formulario de información bancaria (para crear nueva cuenta)
 * 
 * Campos obligatorios (v2.2 - sin holder_name):
 * - Banco o proveedor
 * - Tipo de cuenta
 * - Número de cuenta
 * - Certificación bancaria (RN-07)
 * 
 * NOTA: El documento NO se sube inmediatamente. Se almacena en memoria
 * y se envía junto con el formulario al guardar (RN-28).
 */
export function BankInfoForm({
  value,
  onChange,
  onFileChange,
  errors = {},
  disabled = false,
}: BankInfoFormProps) {
  const updateField = <K extends keyof BankInfo>(
    field: K,
    fieldValue: BankInfo[K]
  ) => {
    onChange({ ...value, [field]: fieldValue })
  }

  // Detectar si es billetera digital para ajustar labels
  const isWallet = value.accountType === "wallet"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banco o proveedor */}
        <div className="space-y-2">
          <Label htmlFor="bankOrProvider">
            Banco o Proveedor <span className="text-destructive">*</span>
          </Label>
          <Select
            value={value.bankOrProvider || ""}
            onValueChange={(val) => updateField("bankOrProvider", val)}
            disabled={disabled}
          >
            <SelectTrigger id="bankOrProvider" aria-invalid={!!errors.bankOrProvider}>
              <SelectValue placeholder="Selecciona banco o proveedor" />
            </SelectTrigger>
            <SelectContent>
              {COLOMBIAN_BANKS.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.bankOrProvider && (
            <p className="text-sm text-destructive">{errors.bankOrProvider}</p>
          )}
        </div>

        {/* Tipo de cuenta */}
        <div className="space-y-2">
          <Label htmlFor="accountType">
            Tipo de Cuenta <span className="text-destructive">*</span>
          </Label>
          <Select
            value={value.accountType || ""}
            onValueChange={(val) => updateField("accountType", val as AccountType)}
            disabled={disabled}
          >
            <SelectTrigger id="accountType" aria-invalid={!!errors.accountType}>
              <SelectValue placeholder="Selecciona tipo de cuenta" />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.accountType && (
            <p className="text-sm text-destructive">{errors.accountType}</p>
          )}
        </div>

        {/* Número de cuenta */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="accountNumber">
            {isWallet ? "Número de Celular" : "Número de Cuenta"}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="accountNumber"
            placeholder={isWallet ? "Ej: 3001234567" : "Ingresa el número de cuenta (6-20 dígitos)"}
            value={value.accountNumber || ""}
            onChange={(e) => updateField("accountNumber", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.accountNumber}
          />
          <p className="text-xs text-muted-foreground">
            El número de cuenta debe tener entre 6 y 20 dígitos
          </p>
          {errors.accountNumber && (
            <p className="text-sm text-destructive">{errors.accountNumber}</p>
          )}
        </div>

        {/* Certificación bancaria */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            {isWallet ? "Comprobante de Billetera" : "Certificación Bancaria"}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <DocumentUpload
            label={isWallet ? "Comprobante de billetera digital" : "Certificación bancaria"}
            accept={ALLOWED_FILE_FORMATS.bankCertificate.map((f) => `.${f}`).join(",")}
            documentType="bank_certificate"
            currentFile={value.bankCertificateUrl}
            onFileChange={onFileChange}
            disabled={disabled}
            hint={`Formatos permitidos: ${ALLOWED_FILE_FORMATS.bankCertificate.join(", ").toUpperCase()}`}
            hasError={!!errors.bankCertificateUrl}
          />
          {errors.bankCertificateUrl && (
            <p className="text-sm text-destructive">{errors.bankCertificateUrl}</p>
          )}
        </div>
      </div>
    </div>
  )
}
