"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BasicInfoSection } from "./basic-info-section"
import { CommissionSection } from "./commission-section"
import { PackagingSection } from "./packaging-section"
import { DeliveryModesSection } from "./delivery-modes-section"
import { StatusSection } from "./status-section"
import { ConfirmCancelModal } from "./confirm-cancel-modal"
import { WarningModal, type WarningType } from "./warning-modal"
import {
  validateProjectName,
  validateCommission,
  hasDeliveryType,
  canActivateProject,
} from "@/lib/types/project/types"
import type {
  Project,
  ProjectType,
  ProjectStatus,
  DeliveryType,
  DeliveryConfig,
  OrganizerLocationConfig,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/types/project/types"

interface ProjectFormProps {
  project?: Project // Si existe, es modo edición
}

interface FormErrors {
  name?: string
  projectType?: string
  description?: string
  logo?: string
  commission?: string
  deliveryModes?: {
    general?: string
    venue?: {
      address?: string
      periodicity?: string
    }
    home?: {
      feeType?: string
    }
  }
  status?: string
}

/**
 * Formulario principal de creación/edición de proyecto
 * 
 * Client Component que maneja:
 * - Información básica (incluye publicCode en edición)
 * - Comisión
 * - Packaging
 * - Modo de entrega (selección única)
 * - Estado
 */
export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const isEditMode = !!project
  
  // Estado del formulario
  const [name, setName] = useState(project?.name || "")
  const [projectType, setProjectType] = useState<ProjectType | undefined>(project?.projectType)
  const [description, setDescription] = useState(project?.description || "")
  const [logoUrl, setLogoUrl] = useState<string | undefined>(project?.logoUrl)
  const [logoFile, setLogoFile] = useState<File | undefined>()
  const [commission, setCommission] = useState<number | undefined>(project?.commission)
  const [customPackaging, setCustomPackaging] = useState(project?.customPackaging || false)
  const [deliveryType, setDeliveryType] = useState<DeliveryType | undefined>(project?.deliveryType)
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(project?.deliveryConfig || null)
  const [status, setStatus] = useState<ProjectStatus>(project?.status || "draft")
  
  // Estado de UI
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [warningModal, setWarningModal] = useState<{
    open: boolean
    type: WarningType | null
    pendingAction: (() => void) | null
  }>({ open: false, type: null, pendingAction: null })
  
  // Valores iniciales para detectar cambios
  const initialValues = useMemo(() => ({
    name: project?.name || "",
    projectType: project?.projectType,
    description: project?.description || "",
    logoUrl: project?.logoUrl,
    commission: project?.commission,
    customPackaging: project?.customPackaging || false,
    deliveryType: project?.deliveryType,
    deliveryConfig: project?.deliveryConfig || null,
    status: project?.status || "draft",
  }), [project])
  
  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditMode) {
      // En modo creación, cualquier campo con valor es un cambio
      return (
        name.trim() !== "" ||
        projectType !== undefined ||
        description.trim() !== "" ||
        logoFile !== undefined ||
        commission !== undefined ||
        customPackaging !== false ||
        deliveryType !== undefined
      )
    }
    
    // En modo edición, comparar con valores iniciales
    return (
      projectType !== initialValues.projectType ||
      description !== initialValues.description ||
      logoFile !== undefined ||
      commission !== initialValues.commission ||
      customPackaging !== initialValues.customPackaging ||
      deliveryType !== initialValues.deliveryType ||
      JSON.stringify(deliveryConfig) !== JSON.stringify(initialValues.deliveryConfig) ||
      status !== initialValues.status
    )
  }, [
    isEditMode,
    name,
    projectType,
    description,
    logoFile,
    commission,
    customPackaging,
    deliveryType,
    deliveryConfig,
    status,
    initialValues,
  ])
  
  // Handlers con advertencias para modo edición
  const handleCommissionChange = useCallback((value: number | undefined) => {
    // TODO: Verificar si el proyecto tiene productos para mostrar advertencia
    setCommission(value)
  }, [])
  
  const handlePackagingChange = useCallback((value: boolean) => {
    // TODO: Verificar si el proyecto tiene productos para mostrar advertencia
    setCustomPackaging(value)
  }, [])
  
  const handleDeliveryTypeChange = useCallback((type: DeliveryType) => {
    // TODO: Verificar si el proyecto tiene productos para mostrar advertencia
    setDeliveryType(type)
  }, [])
  
  const handleDeliveryConfigChange = useCallback((config: DeliveryConfig) => {
    setDeliveryConfig(config)
  }, [])
  
  const handleStatusChange = useCallback((newStatus: ProjectStatus) => {
    // Advertencia al finalizar
    if (newStatus === "finished") {
      setWarningModal({
        open: true,
        type: "finish",
        pendingAction: () => setStatus(newStatus),
      })
      return
    }
    
    setStatus(newStatus)
  }, [])
  
  const handleLogoChange = useCallback((file: File | undefined, previewUrl: string | undefined) => {
    setLogoFile(file)
    if (previewUrl) {
      setLogoUrl(previewUrl)
    } else if (!file) {
      // Si se elimina el archivo, también eliminar la URL si era un preview
      if (logoUrl?.startsWith("data:")) {
        setLogoUrl(project?.logoUrl)
      }
    }
  }, [logoUrl, project?.logoUrl])
  
  const handleWarningConfirm = useCallback(() => {
    if (warningModal.pendingAction) {
      warningModal.pendingAction()
    }
    setWarningModal({ open: false, type: null, pendingAction: null })
  }, [warningModal.pendingAction])
  
  // Type guard para configuración de venue
  const isOrganizerLocationConfig = (config: DeliveryConfig): config is OrganizerLocationConfig => {
    return config !== null && "address" in config
  }
  
  // Validar formulario
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true
    
    // Validar nombre (solo en creación)
    if (!isEditMode) {
      const nameValidation = validateProjectName(name)
      if (!nameValidation.valid) {
        newErrors.name = nameValidation.error
        isValid = false
      }
    }
    
    // Validar tipo de proyecto
    if (!projectType) {
      newErrors.projectType = "Selecciona un tipo de proyecto"
      isValid = false
    }
    
    // Validar comisión
    const commissionValidation = validateCommission(commission)
    if (!commissionValidation.valid) {
      newErrors.commission = commissionValidation.error
      isValid = false
    }
    
    // Validar modo de entrega si está activo o se intenta activar
    if (status === "active" || (isEditMode && project?.status === "active")) {
      if (!hasDeliveryType(deliveryType)) {
        newErrors.deliveryModes = {
          general: "Debe seleccionar un modo de entrega para activar el proyecto",
        }
        isValid = false
      }
    }
    
    // Validar configuración de modo de entrega si está seleccionado
    if (deliveryType === "organizer_location" && isOrganizerLocationConfig(deliveryConfig)) {
      const venueErrors: FormErrors["deliveryModes"] = { venue: {} }
      if (!deliveryConfig.address?.trim()) {
        venueErrors.venue!.address = "La dirección es obligatoria"
        isValid = false
      }
      if (!deliveryConfig.periodicity) {
        venueErrors.venue!.periodicity = "La periodicidad es obligatoria"
        isValid = false
      }
      if (Object.keys(venueErrors.venue!).length > 0) {
        newErrors.deliveryModes = { ...newErrors.deliveryModes, ...venueErrors }
      }
    }
    
    // Validar requisitos para activar
    if (status === "active") {
      const activationCheck = canActivateProject({
        name,
        projectType,
        commission,
        deliveryType,
        deliveryConfig,
        customPackaging,
        status,
      })
      if (!activationCheck.valid) {
        isValid = false
      }
    }
    
    setErrors(newErrors)
    return isValid
  }, [isEditMode, name, projectType, commission, deliveryType, deliveryConfig, status, project?.status])
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const url = isEditMode ? `/api/project/${project.id}` : "/api/project"
      const method = isEditMode ? "PATCH" : "POST"
      
      // Preparar datos del formulario
      const formData = new FormData()
      
      const bodyData: CreateProjectInput | UpdateProjectInput = isEditMode
        ? {
            projectType,
            description: description.trim() || undefined,
            commission,
            customPackaging,
            deliveryType,
            deliveryConfig,
            status,
          }
        : {
            name: name.trim(),
            projectType: projectType!,
            description: description.trim() || undefined,
            commission: commission!,
            customPackaging,
            deliveryType: deliveryType!,
            deliveryConfig,
            status,
          }
      
      formData.append("data", JSON.stringify(bodyData))
      
      // Agregar logo si hay uno nuevo
      if (logoFile) {
        formData.append("logo_file", logoFile)
      }
      
      const response = await fetch(url, {
        method,
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el proyecto")
      }
      
      toast.success(
        isEditMode
          ? "Proyecto actualizado exitosamente"
          : "Proyecto creado exitosamente"
      )
      
      // Redirigir al dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error saving project:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el proyecto"
      )
      setIsSubmitting(false)
    }
  }
  
  // Manejar cancelación
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true)
    } else {
      router.push("/dashboard")
    }
  }, [hasUnsavedChanges, router])
  
  const handleConfirmCancel = useCallback(() => {
    setShowCancelModal(false)
    router.push("/dashboard")
  }, [router])
  
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
            <CardDescription>
              Datos generales del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BasicInfoSection
              name={name}
              projectType={projectType}
              description={description}
              logoUrl={logoUrl}
              logoFile={logoFile}
              publicCode={project?.publicCode}
              isEditMode={isEditMode}
              disabled={isSubmitting}
              errors={{
                name: errors.name,
                projectType: errors.projectType,
                description: errors.description,
                logo: errors.logo,
              }}
              onNameChange={setName}
              onProjectTypeChange={setProjectType}
              onDescriptionChange={setDescription}
              onLogoChange={handleLogoChange}
            />
          </CardContent>
        </Card>
        
        {/* Comisión */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración económica</CardTitle>
            <CardDescription>
              Define tu porcentaje de ganancia (0-100%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommissionSection
              commission={commission}
              disabled={isSubmitting}
              error={errors.commission}
              onChange={handleCommissionChange}
            />
          </CardContent>
        </Card>
        
        {/* Packaging */}
        <Card>
          <CardHeader>
            <CardTitle>Packaging</CardTitle>
            <CardDescription>
              Opciones de empaquetado de productos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PackagingSection
              customPackaging={customPackaging}
              disabled={isSubmitting}
              onChange={handlePackagingChange}
            />
          </CardContent>
        </Card>
        
        {/* Modo de entrega */}
        <Card>
          <CardHeader>
            <CardTitle>Modo de entrega</CardTitle>
            <CardDescription>
              Selecciona cómo llegarán los productos a los compradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryModesSection
              deliveryType={deliveryType}
              deliveryConfig={deliveryConfig}
              disabled={isSubmitting}
              errors={errors.deliveryModes}
              onDeliveryTypeChange={handleDeliveryTypeChange}
              onDeliveryConfigChange={handleDeliveryConfigChange}
            />
          </CardContent>
        </Card>
        
        {/* Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del proyecto</CardTitle>
            <CardDescription>
              Define la visibilidad y disponibilidad del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusSection
              status={status}
              isEditMode={isEditMode}
              disabled={isSubmitting}
              error={errors.status}
              onChange={handleStatusChange}
            />
          </CardContent>
        </Card>
        
        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditMode ? "Guardando..." : "Creando..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode ? "Guardar cambios" : "Crear proyecto"}
              </>
            )}
          </Button>
        </div>
      </form>
      
      {/* Modal de cancelación */}
      <ConfirmCancelModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onConfirm={handleConfirmCancel}
      />
      
      {/* Modal de advertencias */}
      <WarningModal
        open={warningModal.open}
        type={warningModal.type}
        onOpenChange={(open) => {
          if (!open) {
            setWarningModal({ open: false, type: null, pendingAction: null })
          }
        }}
        onConfirm={handleWarningConfirm}
      />
    </>
  )
}
