"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import { BankSection } from "./bank-section"
import type {
  BillingSettings,
  BillingSettingsInput,
  EntityType,
  NaturalPersonLegalInfo,
  LegalEntityLegalInfo,
  ContactInfo,
  BankInfo,
  BankAccount,
} from "@/lib/types/billing/types"

interface BillingFormProps {
  organizerId: string
  initialSettings: BillingSettings | null
  /** Lista de cuentas bancarias del usuario (v2.2) */
  initialAccounts?: BankAccount[]
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
 * 
 * IMPORTANTE (RN-22, RN-23):
 * Los documentos NO se suben inmediatamente al seleccionarlos.
 * Se almacenan en memoria y se envían junto con el formulario al guardar.
 * El servidor procesa todo atómicamente con rollback si falla alguna subida.
 */
export function BillingForm({
  organizerId,
  initialSettings,
  initialAccounts = [],
  userData,
}: BillingFormProps) {
  const router = useRouter()
  
  // Estado del formulario
  const [entityType, setEntityType] = useState<EntityType | null>(
    initialSettings?.entityType || null
  )
  const [entityTypeLocked, setEntityTypeLocked] = useState(
    initialSettings?.entityTypeLocked || false
  )
  
  // RN-26: Autocompletado automático de nombre si no hay perfil previo
  const [naturalPersonInfo, setNaturalPersonInfo] = useState<Partial<NaturalPersonLegalInfo>>(
    initialSettings?.naturalPersonInfo || 
    // Si no hay perfil previo y hay userData, precargar nombre
    (!initialSettings && userData?.name ? { fullName: userData.name } : {})
  )
  const [legalEntityInfo, setLegalEntityInfo] = useState<Partial<LegalEntityLegalInfo>>(
    initialSettings?.legalEntityInfo || {}
  )
  
  // RN-26, RN-27: Autocompletado automático de contactInfo
  // Si no hay perfil previo (initialSettings === null), usar datos de userData
  // Si hay perfil previo, usar datos del servicio
  const [contactInfo, setContactInfo] = useState<Partial<ContactInfo>>(() => {
    if (initialSettings?.contactInfo) {
      // RN-27: Ya existe perfil, usar datos del servicio
      return initialSettings.contactInfo
    }
    // RN-26: No existe perfil, autocompletar desde userData si está disponible
    if (userData) {
      return {
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
      }
    }
    return {}
  })
  
  const [bankInfo, setBankInfo] = useState<Partial<BankInfo>>(
    initialSettings?.bankInfo || {}
  )
  const [verificationStatus, setVerificationStatus] = useState(
    initialSettings?.verificationStatus || null
  )
  
  // Estado de cuentas bancarias (v2.2)
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts)

  // Estado de archivos (File objects en memoria)
  const [idDocumentFile, setIdDocumentFile] = useState<File | undefined>(undefined)
  const [rutDocumentFile, setRutDocumentFile] = useState<File | undefined>(undefined)
  const [bankCertificateFile, setBankCertificateFile] = useState<File | undefined>(undefined)

  // Para mostrar nombres de archivos existentes (ya guardados en el servidor)
  const existingIdDocumentUrl = initialSettings?.naturalPersonInfo?.idDocumentUrl
  const existingRutDocumentUrl = initialSettings?.legalEntityInfo?.rutDocumentUrl
  const existingBankCertificateUrl = initialSettings?.bankInfo?.bankCertificateUrl

  // Estado de UI
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Verificar si hay un documento disponible (nuevo o existente)
  const hasIdDocument = !!idDocumentFile || !!existingIdDocumentUrl
  const hasRutDocument = !!rutDocumentFile || !!existingRutDocumentUrl
  const hasBankCertificate = !!bankCertificateFile || !!existingBankCertificateUrl

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
      // RN-05: Documento de identidad obligatorio
      if (!hasIdDocument) {
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
      // RN-06: RUT obligatorio para persona jurídica
      if (!hasRutDocument) {
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

    // Validar información bancaria (v2.2 - sin accountHolder)
    const bankErrors: Partial<Record<keyof BankInfo, string>> = {}
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
    // RN-07: Certificación bancaria obligatoria
    if (!hasBankCertificate) {
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
      // Construir datos del formulario (sin archivos)
      const formDataJson: BillingSettingsInput = {
        entityType: entityType!,
        contactInfo: contactInfo as ContactInfo,
        bankInfo: bankInfo as Omit<BankInfo, "bankCertificateUrl">,
      }

      if (entityType === "natural") {
        formDataJson.naturalPersonInfo = naturalPersonInfo as Omit<NaturalPersonLegalInfo, "idDocumentUrl">
      } else if (entityType === "legal") {
        formDataJson.legalEntityInfo = legalEntityInfo as Omit<LegalEntityLegalInfo, "rutDocumentUrl">
      }

      // Crear FormData con datos JSON y archivos
      const formData = new FormData()
      formData.append("data", JSON.stringify(formDataJson))

      // Agregar archivos si existen (nuevos archivos seleccionados)
      if (idDocumentFile) {
        formData.append("id_document_file", idDocumentFile)
      }
      if (rutDocumentFile) {
        formData.append("rut_file", rutDocumentFile)
      }
      if (bankCertificateFile) {
        formData.append("bank_certificate_file", bankCertificateFile)
      }

      // Enviar como multipart/form-data
      const response = await fetch("/api/settings/billing", {
        method: "POST",
        body: formData,
        // No establecer Content-Type, el navegador lo hace automáticamente con boundary
      })

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Error de servidor. Intenta nuevamente.")
      }

      const result = await response.json()

      if (!response.ok) {
        // Manejar error específico de subida de documentos (RN-23)
        if (result.error === "DOCUMENT_UPLOAD_FAILED") {
          throw new Error(result.message || "Error al subir los documentos. Intenta nuevamente.")
        }
        throw new Error(result.message || result.error || "Error al guardar la configuración")
      }

      // RN-38: Mostrar mensaje de éxito y redirigir al dashboard
      toast.success("Configuración guardada exitosamente")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving billing settings:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración"
      )
      setIsSubmitting(false)
    }
    // No llamamos setIsSubmitting(false) en éxito porque vamos a redirigir
  }

  // Handlers para archivos que actualizan el estado con File objects
  const handleIdDocumentChange = (file: File | undefined) => {
    setIdDocumentFile(file)
  }

  const handleRutDocumentChange = (file: File | undefined) => {
    setRutDocumentFile(file)
  }

  const handleBankCertificateChange = (file: File | undefined) => {
    setBankCertificateFile(file)
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
                onFileChange={handleIdDocumentChange}
                errors={errors.naturalPersonInfo}
                disabled={isSubmitting}
              />
            ) : (
              <LegalInfoLegal
                value={legalEntityInfo}
                onChange={setLegalEntityInfo}
                onFileChange={handleRutDocumentChange}
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
            />
          </CardContent>
        </Card>
      )}

      {/* Información Bancaria (v2.2 - con lista de cuentas) */}
      {entityType && (
        <Card>
          <CardHeader>
            <CardTitle>Información Bancaria</CardTitle>
            <CardDescription>
              {accounts.length > 0 
                ? "Gestiona tus cuentas bancarias para recibir pagos"
                : "Configura tu cuenta bancaria para recibir pagos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BankSection
              accounts={accounts}
              bankInfo={bankInfo}
              onBankInfoChange={setBankInfo}
              onFileChange={handleBankCertificateChange}
              onAccountsChange={setAccounts}
              errors={errors.bankInfo}
              disabled={isSubmitting}
              verificationStatus={verificationStatus}
            />
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
