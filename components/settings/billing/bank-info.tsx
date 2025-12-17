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
  onFileChange: (fileName: string | undefined) => void
  errors?: Partial<Record<keyof BankInfo, string>>
  disabled?: boolean
}

/**
 * Formulario de información bancaria
 * 
 * Campos obligatorios:
 * - Titular de la cuenta
 * - Banco o proveedor
 * - Tipo de cuenta
 * - Número de cuenta
 * - Certificación bancaria (RN-05)
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
        {/* Titular de la cuenta */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="accountHolder">
            Titular de la Cuenta <span className="text-destructive">*</span>
          </Label>
          <Input
            id="accountHolder"
            placeholder="Nombre completo del titular"
            value={value.accountHolder || ""}
            onChange={(e) => updateField("accountHolder", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.accountHolder}
          />
          {errors.accountHolder && (
            <p className="text-sm text-destructive">{errors.accountHolder}</p>
          )}
        </div>

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
            placeholder={isWallet ? "Ej: 3001234567" : "Ingresa el número de cuenta"}
            value={value.accountNumber || ""}
            onChange={(e) => updateField("accountNumber", e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors.accountNumber}
          />
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
            currentFile={value.bankCertificateUrl}
            onFileSelect={onFileChange}
            disabled={disabled}
            hint={`Formatos permitidos: ${ALLOWED_FILE_FORMATS.bankCertificate.join(", ").toUpperCase()}`}
          />
          {errors.bankCertificateUrl && (
            <p className="text-sm text-destructive">{errors.bankCertificateUrl}</p>
          )}
        </div>
      </div>
    </div>
  )
}

