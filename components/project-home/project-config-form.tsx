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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CommissionSection } from "@/components/project/commission-section"
import { PackagingSection } from "@/components/project/packaging-section"
import { DeliveryModesSection } from "@/components/project/delivery-modes-section"
import { StatusSection } from "@/components/project/status-section"
import { ConfirmCancelModal } from "@/components/project/confirm-cancel-modal"
import { WarningModal, type WarningType } from "@/components/project/warning-modal"
import {
  validateCommission,
  hasDeliveryType,
  canActivateProject,
  PROJECT_TYPES,
} from "@/lib/types/project/types"
import type {
  Project,
  ProjectType,
  ProjectStatus,
  DeliveryType,
  DeliveryConfig,
  OrganizerLocationConfig,
  UpdateProjectInput,
} from "@/lib/types/project/types"

interface ProjectConfigFormProps {
  project: Project
  /** URL a la que redirigir después de guardar (por defecto /project/{id}) */
  returnUrl?: string
}

interface FormErrors {
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
 * Formulario de configuración del proyecto
 * 
 * Versión adaptada del ProjectForm para la vista del Home del Proyecto.
 * - El nombre del proyecto es solo lectura (RN-03)
 * - Redirige al home del proyecto después de guardar
 */
export function ProjectConfigForm({ project, returnUrl }: ProjectConfigFormProps) {
  const router = useRouter()
  const defaultReturnUrl = returnUrl || `/project/${project.publicCode}`
  
  // Estado del formulario
  const [projectType, setProjectType] = useState<ProjectType | undefined>(project.projectType)
  const [description, setDescription] = useState(project.description || "")
  const [commission, setCommission] = useState<number | undefined>(project.commission)
  const [customPackaging, setCustomPackaging] = useState(project.customPackaging || false)
  const [deliveryType, setDeliveryType] = useState<DeliveryType | undefined>(project.deliveryType)
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(project.deliveryConfig || null)
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  
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
    projectType: project.projectType,
    description: project.description || "",
    commission: project.commission,
    customPackaging: project.customPackaging || false,
    deliveryType: project.deliveryType,
    deliveryConfig: project.deliveryConfig || null,
    status: project.status,
  }), [project])
  
  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = useMemo(() => {
    return (
      projectType !== initialValues.projectType ||
      description !== initialValues.description ||
      commission !== initialValues.commission ||
      customPackaging !== initialValues.customPackaging ||
      deliveryType !== initialValues.deliveryType ||
      JSON.stringify(deliveryConfig) !== JSON.stringify(initialValues.deliveryConfig) ||
      status !== initialValues.status
    )
  }, [
    projectType,
    description,
    commission,
    customPackaging,
    deliveryType,
    deliveryConfig,
    status,
    initialValues,
  ])
  
  // Handlers
  const handleCommissionChange = useCallback((value: number | undefined) => {
    setCommission(value)
  }, [])
  
  const handlePackagingChange = useCallback((value: boolean) => {
    setCustomPackaging(value)
  }, [])
  
  const handleDeliveryTypeChange = useCallback((type: DeliveryType) => {
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
    
    // Validar comisión
    const commissionValidation = validateCommission(commission)
    if (!commissionValidation.valid) {
      newErrors.commission = commissionValidation.error
      isValid = false
    }
    
    // Validar modo de entrega si está activo o se intenta activar
    if (status === "active" || project.status === "active") {
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
        name: project.name,
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
  }, [commission, deliveryType, deliveryConfig, status, project.status, project.name, projectType, customPackaging])
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const url = `/api/project/${project.id}`
      const method = "PATCH"
      
      // Preparar datos del formulario
      const formData = new FormData()
      
      const bodyData: UpdateProjectInput = {
        projectType,
        description: description.trim() || undefined,
        commission,
        customPackaging,
        deliveryType,
        deliveryConfig,
        status,
      }
      
      formData.append("data", JSON.stringify(bodyData))
      
      const response = await fetch(url, {
        method,
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Error al guardar la configuración")
      }
      
      toast.success("Configuración guardada exitosamente")
      
      // Redirigir al home del proyecto
      router.push(defaultReturnUrl)
      router.refresh()
    } catch (error) {
      console.error("Error saving project config:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración"
      )
      setIsSubmitting(false)
    }
  }
  
  // Manejar cancelación
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true)
    } else {
      router.push(defaultReturnUrl)
    }
  }, [hasUnsavedChanges, router, defaultReturnUrl])
  
  const handleConfirmCancel = useCallback(() => {
    setShowCancelModal(false)
    router.push(defaultReturnUrl)
  }, [router, defaultReturnUrl])

  // Obtener label del tipo de proyecto
  const projectTypeLabel = PROJECT_TYPES.find((t) => t.id === project.projectType)?.name || project.projectType
  
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del proyecto (solo lectura) */}
        <Card>
          <CardHeader>
            <CardTitle>Información del proyecto</CardTitle>
            <CardDescription>
              Datos básicos del proyecto (no editables)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre (solo lectura - RN-03) */}
            <div className="space-y-2">
              <Label>Nombre del proyecto</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={project.name}
                  disabled
                  className="bg-muted"
                />
                <Badge variant="secondary">Solo lectura</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                El nombre del proyecto no puede ser modificado después de su creación
              </p>
            </div>

            {/* Código público (solo lectura) */}
            <div className="space-y-2">
              <Label>Código público</Label>
              <Input
                value={project.publicCode}
                disabled
                className="bg-muted font-mono"
              />
            </div>

            {/* Tipo de proyecto (solo lectura por ahora) */}
            <div className="space-y-2">
              <Label>Tipo de proyecto</Label>
              <Input
                value={projectTypeLabel}
                disabled
                className="bg-muted"
              />
            </div>
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
              isEditMode={true}
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
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar configuración
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
