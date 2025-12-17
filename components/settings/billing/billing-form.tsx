"use client"

import { useState, useCallback } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EntityTypeSelector } from "./entity-type-selector"
import { LegalInfoNatural } from "./legal-info-natural"
import { LegalInfoLegal } from "./legal-info-legal"
import { ContactInfoForm } from "./contact-info"
import { BankInfoForm } from "./bank-info"
import { VerificationStatusDisplay } from "./verification-status"
import type {
  BillingSettings,
  BillingSettingsInput,
  EntityType,
  NaturalPersonLegalInfo,
  LegalEntityLegalInfo,
  ContactInfo,
  BankInfo,
} from "@/lib/types/billing/types"

interface BillingFormProps {
  organizerId: string
  initialSettings: BillingSettings | null
  userData?: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }
}

interface FormErrors {
  entityType?: string
  naturalPersonInfo?: Partial<Record<keyof NaturalPersonLegalInfo, string>>
  legalEntityInfo?: Partial<Record<keyof LegalEntityLegalInfo, string>>
  contactInfo?: Partial<Record<keyof ContactInfo, string>>
  bankInfo?: Partial<Record<keyof BankInfo, string>>
}

/**
 * Formulario principal de configuración de facturación
 * 
 * Client Component que maneja:
 * - Selección de tipo de entidad
 * - Información legal (condicional)
 * - Datos de contacto
 * - Información bancaria
 * - Estado de verificación
 */
export function BillingForm({
  organizerId,
  initialSettings,
  userData,
}: BillingFormProps) {
  // Estado del formulario
  const [entityType, setEntityType] = useState<EntityType | null>(
    initialSettings?.entityType || null
  )
  const [entityTypeLocked, setEntityTypeLocked] = useState(
    initialSettings?.entityTypeLocked || false
  )
  const [naturalPersonInfo, setNaturalPersonInfo] = useState<Partial<NaturalPersonLegalInfo>>(
    initialSettings?.naturalPersonInfo || {}
  )
  const [legalEntityInfo, setLegalEntityInfo] = useState<Partial<LegalEntityLegalInfo>>(
    initialSettings?.legalEntityInfo || {}
  )
  const [contactInfo, setContactInfo] = useState<Partial<ContactInfo>>(
    initialSettings?.contactInfo || {}
  )
  const [bankInfo, setBankInfo] = useState<Partial<BankInfo>>(
    initialSettings?.bankInfo || {}
  )
  const [verificationStatus, setVerificationStatus] = useState(
    initialSettings?.verificationStatus || null
  )

  // Estado de archivos (mock)
  const [idDocumentFileName, setIdDocumentFileName] = useState<string | undefined>(
    initialSettings?.naturalPersonInfo?.idDocumentUrl
  )
  const [rutDocumentFileName, setRutDocumentFileName] = useState<string | undefined>(
    initialSettings?.legalEntityInfo?.rutDocumentUrl
  )
  const [bankCertificateFileName, setBankCertificateFileName] = useState<string | undefined>(
    initialSettings?.bankInfo?.bankCertificateUrl
  )

  // Estado de autocompletado
  const [useProfileData, setUseProfileData] = useState(false)

  // Estado de UI
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Manejar autocompletado de datos del perfil
  const handleUseProfileData = useCallback((use: boolean) => {
    setUseProfileData(use)
    if (use && userData) {
      setContactInfo({
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
      })
      // También precargar nombre en info legal si es persona natural
      if (entityType === "natural" && userData.name) {
        setNaturalPersonInfo((prev) => ({
          ...prev,
          fullName: userData.name,
        }))
      }
    }
  }, [userData, entityType])

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    // Validar tipo de entidad
    if (!entityType) {
      newErrors.entityType = "Debes seleccionar un tipo de entidad"
      isValid = false
    }

    // Validar información legal según tipo
    if (entityType === "natural") {
      const naturalErrors: Partial<Record<keyof NaturalPersonLegalInfo, string>> = {}
      if (!naturalPersonInfo.fullName?.trim()) {
        naturalErrors.fullName = "El nombre completo es obligatorio"
        isValid = false
      }
      if (!naturalPersonInfo.documentType) {
        naturalErrors.documentType = "El tipo de documento es obligatorio"
        isValid = false
      }
      if (!naturalPersonInfo.documentNumber?.trim()) {
        naturalErrors.documentNumber = "El número de documento es obligatorio"
        isValid = false
      }
      if (!naturalPersonInfo.fiscalAddress?.trim()) {
        naturalErrors.fiscalAddress = "La dirección fiscal es obligatoria"
        isValid = false
      }
      if (!idDocumentFileName) {
        naturalErrors.idDocumentUrl = "La copia de la cédula es obligatoria"
        isValid = false
      }
      if (Object.keys(naturalErrors).length > 0) {
        newErrors.naturalPersonInfo = naturalErrors
      }
    } else if (entityType === "legal") {
      const legalErrors: Partial<Record<keyof LegalEntityLegalInfo, string>> = {}
      if (!legalEntityInfo.businessName?.trim()) {
        legalErrors.businessName = "La razón social es obligatoria"
        isValid = false
      }
      if (!legalEntityInfo.nit?.trim()) {
        legalErrors.nit = "El NIT es obligatorio"
        isValid = false
      }
      if (!legalEntityInfo.fiscalAddress?.trim()) {
        legalErrors.fiscalAddress = "La dirección fiscal es obligatoria"
        isValid = false
      }
      if (!rutDocumentFileName) {
        legalErrors.rutDocumentUrl = "El RUT es obligatorio"
        isValid = false
      }
      if (Object.keys(legalErrors).length > 0) {
        newErrors.legalEntityInfo = legalErrors
      }
    }

    // Validar datos de contacto
    const contactErrors: Partial<Record<keyof ContactInfo, string>> = {}
    if (!contactInfo.email?.trim()) {
      contactErrors.email = "El email de contacto es obligatorio"
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      contactErrors.email = "El formato del email no es válido"
      isValid = false
    }
    if (!contactInfo.phone?.trim()) {
      contactErrors.phone = "El teléfono es obligatorio"
      isValid = false
    }
    if (!contactInfo.address?.trim()) {
      contactErrors.address = "La dirección es obligatoria"
      isValid = false
    }
    if (Object.keys(contactErrors).length > 0) {
      newErrors.contactInfo = contactErrors
    }

    // Validar información bancaria
    const bankErrors: Partial<Record<keyof BankInfo, string>> = {}
    if (!bankInfo.accountHolder?.trim()) {
      bankErrors.accountHolder = "El titular de la cuenta es obligatorio"
      isValid = false
    }
    if (!bankInfo.bankOrProvider) {
      bankErrors.bankOrProvider = "El banco o proveedor es obligatorio"
      isValid = false
    }
    if (!bankInfo.accountType) {
      bankErrors.accountType = "El tipo de cuenta es obligatorio"
      isValid = false
    }
    if (!bankInfo.accountNumber?.trim()) {
      bankErrors.accountNumber = "El número de cuenta es obligatorio"
      isValid = false
    }
    if (!bankCertificateFileName) {
      bankErrors.bankCertificateUrl = "La certificación bancaria es obligatoria"
      isValid = false
    }
    if (Object.keys(bankErrors).length > 0) {
      newErrors.bankInfo = bankErrors
    }

    setErrors(newErrors)
    return isValid
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario")
      return
    }

    setIsSubmitting(true)

    try {
      const input: BillingSettingsInput = {
        entityType: entityType!,
        contactInfo: contactInfo as ContactInfo,
        bankInfo: bankInfo as Omit<BankInfo, "bankCertificateUrl">,
        bankCertificateFileName,
      }

      if (entityType === "natural") {
        input.naturalPersonInfo = naturalPersonInfo as Omit<NaturalPersonLegalInfo, "idDocumentUrl">
        input.idDocumentFileName = idDocumentFileName
      } else if (entityType === "legal") {
        input.legalEntityInfo = legalEntityInfo as Omit<LegalEntityLegalInfo, "rutDocumentUrl">
        input.rutDocumentFileName = rutDocumentFileName
      }

      const response = await fetch("/api/settings/billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar la configuración")
      }

      // Actualizar estado con la respuesta
      if (result.data) {
        setEntityTypeLocked(result.data.entityTypeLocked)
        setVerificationStatus(result.data.verificationStatus)
      }

      toast.success("Configuración guardada exitosamente")
    } catch (error) {
      console.error("Error saving billing settings:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Entidad */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Entidad</CardTitle>
          <CardDescription>
            Selecciona si actúas como persona natural o representas una empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EntityTypeSelector
            value={entityType}
            onChange={setEntityType}
            disabled={isSubmitting}
            locked={entityTypeLocked}
          />
          {errors.entityType && (
            <p className="text-sm text-destructive mt-2">{errors.entityType}</p>
          )}
        </CardContent>
      </Card>

      {/* Información Legal (condicional) */}
      {entityType && (
        <Card>
          <CardHeader>
            <CardTitle>Información Legal</CardTitle>
            <CardDescription>
              {entityType === "natural"
                ? "Datos de identificación personal"
                : "Datos de la empresa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entityType === "natural" ? (
              <LegalInfoNatural
                value={naturalPersonInfo}
                onChange={setNaturalPersonInfo}
                onFileChange={setIdDocumentFileName}
                errors={errors.naturalPersonInfo}
                disabled={isSubmitting}
              />
            ) : (
              <LegalInfoLegal
                value={legalEntityInfo}
                onChange={setLegalEntityInfo}
                onFileChange={setRutDocumentFileName}
                errors={errors.legalEntityInfo}
                disabled={isSubmitting}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Datos de Contacto */}
      {entityType && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de Contacto</CardTitle>
            <CardDescription>
              Información de contacto para asuntos financieros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactInfoForm
              value={contactInfo}
              onChange={setContactInfo}
              errors={errors.contactInfo}
              disabled={isSubmitting}
              userData={userData}
              onUseProfileData={handleUseProfileData}
              useProfileData={useProfileData}
              showAutoComplete={entityType === "natural"}
            />
          </CardContent>
        </Card>
      )}

      {/* Información Bancaria */}
      {entityType && (
        <Card>
          <CardHeader>
            <CardTitle>Información Bancaria</CardTitle>
            <CardDescription>
              Cuenta donde recibirás los pagos de tus ventas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <BankInfoForm
              value={bankInfo}
              onChange={setBankInfo}
              onFileChange={setBankCertificateFileName}
              errors={errors.bankInfo}
              disabled={isSubmitting}
            />

            {/* Estado de verificación */}
            {verificationStatus && (
              <VerificationStatusDisplay status={verificationStatus} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Botón de guardar */}
      {entityType && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}

