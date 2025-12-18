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
  hasDeliveryMode,
  canActivateProject,
  DEFAULT_DELIVERY_MODES,
} from "@/lib/types/project/types"
import type {
  Project,
  ProjectType,
  ProjectStatus,
  DeliveryModes,
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
      costType?: string
    }
  }
  status?: string
}

/**
 * Formulario principal de creación/edición de proyecto
 * 
 * Client Component que maneja:
 * - Información básica
 * - Comisión
 * - Packaging
 * - Modos de entrega
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
  const [logoFileName, setLogoFileName] = useState<string | undefined>()
  const [commission, setCommission] = useState<number | undefined>(project?.commission)
  const [customPackaging, setCustomPackaging] = useState(project?.customPackaging || false)
  const [deliveryModes, setDeliveryModes] = useState<DeliveryModes>(
    project?.deliveryModes || DEFAULT_DELIVERY_MODES
  )
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
    deliveryModes: project?.deliveryModes || DEFAULT_DELIVERY_MODES,
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
        logoUrl !== undefined ||
        commission !== undefined ||
        customPackaging !== false ||
        deliveryModes.venue.enabled ||
        deliveryModes.home.enabled ||
        deliveryModes.pickup.enabled
      )
    }
    
    // En modo edición, comparar con valores iniciales
    return (
      projectType !== initialValues.projectType ||
      description !== initialValues.description ||
      logoUrl !== initialValues.logoUrl ||
      commission !== initialValues.commission ||
      customPackaging !== initialValues.customPackaging ||
      JSON.stringify(deliveryModes) !== JSON.stringify(initialValues.deliveryModes) ||
      status !== initialValues.status
    )
  }, [
    isEditMode,
    name,
    projectType,
    description,
    logoUrl,
    commission,
    customPackaging,
    deliveryModes,
    status,
    initialValues,
  ])
  
  // Handlers con advertencias para modo edición
  const handleCommissionChange = useCallback((value: number | undefined) => {
    if (isEditMode && project?.hasProducts && value !== initialValues.commission) {
      setWarningModal({
        open: true,
        type: "commission",
        pendingAction: () => setCommission(value),
      })
    } else {
      setCommission(value)
    }
  }, [isEditMode, project?.hasProducts, initialValues.commission])
  
  const handlePackagingChange = useCallback((value: boolean) => {
    if (isEditMode && project?.hasProducts && value !== initialValues.customPackaging) {
      setWarningModal({
        open: true,
        type: "packaging",
        pendingAction: () => setCustomPackaging(value),
      })
    } else {
      setCustomPackaging(value)
    }
  }, [isEditMode, project?.hasProducts, initialValues.customPackaging])
  
  const handleDeliveryModesChange = useCallback((modes: DeliveryModes) => {
    if (isEditMode && project?.hasProducts) {
      const hasSignificantChange = 
        modes.venue.enabled !== initialValues.deliveryModes.venue.enabled ||
        modes.home.enabled !== initialValues.deliveryModes.home.enabled ||
        modes.pickup.enabled !== initialValues.deliveryModes.pickup.enabled
      
      if (hasSignificantChange) {
        setWarningModal({
          open: true,
          type: "delivery",
          pendingAction: () => setDeliveryModes(modes),
        })
        return
      }
    }
    setDeliveryModes(modes)
  }, [isEditMode, project?.hasProducts, initialValues.deliveryModes])
  
  const handleStatusChange = useCallback((newStatus: ProjectStatus) => {
    // Advertencia al pausar con pedidos activos
    if (newStatus === "paused" && project?.hasActiveOrders) {
      setWarningModal({
        open: true,
        type: "pause",
        pendingAction: () => setStatus(newStatus),
      })
      return
    }
    
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
  }, [project?.hasActiveOrders])
  
  const handleLogoChange = useCallback((dataUrl: string | undefined, fileName: string | undefined) => {
    setLogoUrl(dataUrl)
    setLogoFileName(fileName)
  }, [])
  
  const handleWarningConfirm = useCallback(() => {
    if (warningModal.pendingAction) {
      warningModal.pendingAction()
    }
    setWarningModal({ open: false, type: null, pendingAction: null })
  }, [warningModal.pendingAction])
  
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
    
    // Validar modos de entrega si está activo o se intenta activar
    if (status === "active" || (isEditMode && project?.status === "active")) {
      if (!hasDeliveryMode(deliveryModes)) {
        newErrors.deliveryModes = {
          general: "Debe seleccionar al menos un modo de entrega para activar el proyecto",
        }
        isValid = false
      }
    }
    
    // Validar configuración de modos de entrega habilitados
    if (deliveryModes.venue.enabled) {
      const venueErrors: FormErrors["deliveryModes"] = { venue: {} }
      if (!deliveryModes.venue.address?.trim()) {
        venueErrors.venue!.address = "La dirección es obligatoria"
        isValid = false
      }
      if (!deliveryModes.venue.periodicity) {
        venueErrors.venue!.periodicity = "La periodicidad es obligatoria"
        isValid = false
      }
      if (Object.keys(venueErrors.venue!).length > 0) {
        newErrors.deliveryModes = { ...newErrors.deliveryModes, ...venueErrors }
      }
    }
    
    if (deliveryModes.home.enabled && !deliveryModes.home.costType) {
      newErrors.deliveryModes = {
        ...newErrors.deliveryModes,
        home: { costType: "Selecciona el tipo de costo" },
      }
      isValid = false
    }
    
    // Validar requisitos para activar
    if (status === "active") {
      const activationCheck = canActivateProject({
        name,
        projectType,
        commission,
        deliveryModes,
        customPackaging,
        status,
      })
      if (!activationCheck.valid) {
        // Los errores específicos ya fueron agregados arriba
        isValid = false
      }
    }
    
    setErrors(newErrors)
    return isValid
  }, [isEditMode, name, projectType, commission, deliveryModes, status, project?.status])
  
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
      const method = isEditMode ? "PUT" : "POST"
      
      const body: CreateProjectInput | UpdateProjectInput = isEditMode
        ? {
            projectType,
            description: description.trim() || undefined,
            logoFileName,
            commission,
            customPackaging,
            deliveryModes,
            status,
          }
        : {
            name: name.trim(),
            projectType: projectType!,
            description: description.trim() || undefined,
            logoFileName,
            commission: commission!,
            customPackaging,
            deliveryModes,
            status,
          }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
    } finally {
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
              logoFileName={logoFileName}
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
              Define tu porcentaje de ganancia
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
        
        {/* Modos de entrega */}
        <Card>
          <CardHeader>
            <CardTitle>Modos de entrega</CardTitle>
            <CardDescription>
              Configura cómo llegarán los productos a los compradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryModesSection
              deliveryModes={deliveryModes}
              disabled={isSubmitting}
              errors={errors.deliveryModes}
              onChange={handleDeliveryModesChange}
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

