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
import { CategorySelector } from "./category-selector"
import { BasicInfoSection } from "./basic-info-section"
import { PersonalizationConfig } from "./personalization-config"
import { ImageManager } from "./image-manager"
import { StatusSection } from "./status-section"
import { ConfirmCancelModal } from "./confirm-cancel-modal"
import {
  validateProductName,
  validateBasePrice,
  validateModulesForCategory,
  canActivateProduct,
  createEmptyPersonalizationConfig,
} from "@/lib/types/product/types"
import type {
  Product,
  ProductCategory,
  PersonalizationModule,
  ProductStatus,
  PersonalizationConfig as PersonalizationConfigType,
  ProductImage,
} from "@/lib/types/product/types"

interface ProductFormProps {
  projectId: string
  product?: Product // Si existe, es modo edición
  categories: ProductCategory[]
  modules: PersonalizationModule[]
  isConfigEditable?: boolean // Solo aplica en edición
}

interface FormErrors {
  category?: string
  name?: string
  description?: string
  basePrice?: string
  personalization?: string
  images?: string
  status?: string
}

/**
 * Formulario principal de creación/edición de producto
 * 
 * Client Component que maneja:
 * - Selección de categoría
 * - Información básica (nombre, descripción, precio)
 * - Configuración de personalización (módulos)
 * - Gestión de imágenes
 * - Estado del producto
 */
export function ProductForm({ 
  projectId, 
  product, 
  categories, 
  modules,
  isConfigEditable = true,
}: ProductFormProps) {
  const router = useRouter()
  const isEditMode = !!product
  
  // Estado del formulario
  const [categoryId, setCategoryId] = useState<string | undefined>(product?.categoryId)
  const [name, setName] = useState(product?.name || "")
  const [description, setDescription] = useState(product?.description || "")
  const [basePrice, setBasePrice] = useState<number | undefined>(product?.basePrice)
  const [personalizationConfig, setPersonalizationConfig] = useState<PersonalizationConfigType>(
    product?.personalizationConfig || createEmptyPersonalizationConfig()
  )
  const [images, setImages] = useState<ProductImage[]>(product?.images || [])
  const [status, setStatus] = useState<ProductStatus>(product?.status || "draft")
  
  // Estado de UI
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  
  // Obtener categoría seleccionada
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === categoryId)
  }, [categories, categoryId])
  
  // Valores iniciales para detectar cambios
  const initialValues = useMemo(() => ({
    categoryId: product?.categoryId,
    name: product?.name || "",
    description: product?.description || "",
    basePrice: product?.basePrice,
    personalizationConfig: product?.personalizationConfig || createEmptyPersonalizationConfig(),
    status: product?.status || "draft",
  }), [product])
  
  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditMode) {
      return (
        categoryId !== undefined ||
        name.trim() !== "" ||
        description.trim() !== "" ||
        basePrice !== undefined
      )
    }
    
    return (
      categoryId !== initialValues.categoryId ||
      name !== initialValues.name ||
      description !== initialValues.description ||
      basePrice !== initialValues.basePrice ||
      JSON.stringify(personalizationConfig) !== JSON.stringify(initialValues.personalizationConfig) ||
      status !== initialValues.status
    )
  }, [
    isEditMode,
    categoryId,
    name,
    description,
    basePrice,
    personalizationConfig,
    status,
    initialValues,
  ])
  
  // Handlers
  const handleCategoryChange = useCallback((newCategoryId: string) => {
    setCategoryId(newCategoryId)
    // Limpiar configuración de personalización al cambiar categoría
    if (newCategoryId !== categoryId) {
      setPersonalizationConfig(createEmptyPersonalizationConfig())
    }
  }, [categoryId])
  
  const handlePersonalizationChange = useCallback((config: PersonalizationConfigType) => {
    setPersonalizationConfig(config)
  }, [])
  
  const handleImagesChange = useCallback((newImages: ProductImage[]) => {
    setImages(newImages)
  }, [])
  
  const handleStatusChange = useCallback((newStatus: ProductStatus) => {
    setStatus(newStatus)
  }, [])
  
  // Validar formulario
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true
    
    // Validar categoría
    if (!categoryId) {
      newErrors.category = "Selecciona una categoría"
      isValid = false
    }
    
    // Validar nombre
    const nameValidation = validateProductName(name)
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error
      isValid = false
    }
    
    // Validar precio
    const priceValidation = validateBasePrice(basePrice)
    if (!priceValidation.valid) {
      newErrors.basePrice = priceValidation.error
      isValid = false
    }
    
    // Validar módulos de personalización
    if (selectedCategory && personalizationConfig) {
      const modulesValidation = validateModulesForCategory(
        personalizationConfig,
        selectedCategory.allowedModules
      )
      if (!modulesValidation.valid) {
        newErrors.personalization = modulesValidation.error
        isValid = false
      }
    }
    
    // Validar requisitos para activar
    if (status === "active") {
      const activationCheck = canActivateProduct(
        { name, basePrice },
        images.length
      )
      if (!activationCheck.valid) {
        newErrors.status = activationCheck.errors[0]
        isValid = false
      }
    }
    
    setErrors(newErrors)
    return isValid
  }, [categoryId, name, basePrice, selectedCategory, personalizationConfig, status, images.length])
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const url = isEditMode ? `/api/product/${product.id}` : "/api/product"
      const method = isEditMode ? "PATCH" : "POST"
      
      const bodyData = isEditMode
        ? {
            name: name.trim(),
            description: description.trim() || undefined,
            basePrice,
            ...(isConfigEditable && { personalizationConfig }),
            status,
          }
        : {
            projectId,
            categoryId,
            name: name.trim(),
            description: description.trim() || undefined,
            basePrice,
            personalizationConfig,
          }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el producto")
      }
      
      toast.success(
        isEditMode
          ? "Producto actualizado exitosamente"
          : "Producto creado exitosamente"
      )
      
      // Redirigir a la lista de productos
      router.push(`/project/${projectId}/products`)
      router.refresh()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el producto"
      )
      setIsSubmitting(false)
    }
  }
  
  // Manejar cancelación
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true)
    } else {
      router.push(`/project/${projectId}/products`)
    }
  }, [hasUnsavedChanges, router, projectId])
  
  const handleConfirmCancel = useCallback(() => {
    setShowCancelModal(false)
    router.push(`/project/${projectId}/products`)
  }, [router, projectId])
  
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Categoría</CardTitle>
            <CardDescription>
              Selecciona el tipo de producto. Esto determina las opciones de personalización disponibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategorySelector
              categories={categories}
              selectedCategoryId={categoryId}
              disabled={isSubmitting || (isEditMode && !isConfigEditable)}
              error={errors.category}
              onChange={handleCategoryChange}
            />
          </CardContent>
        </Card>
        
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
            <CardDescription>
              Nombre, descripción y precio del producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BasicInfoSection
              name={name}
              description={description}
              basePrice={basePrice}
              disabled={isSubmitting}
              errors={{
                name: errors.name,
                description: errors.description,
                basePrice: errors.basePrice,
              }}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onBasePriceChange={setBasePrice}
            />
          </CardContent>
        </Card>
        
        {/* Configuración de personalización */}
        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Personalización</CardTitle>
              <CardDescription>
                Configura las opciones de personalización disponibles para el comprador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalizationConfig
                category={selectedCategory}
                modules={modules}
                config={personalizationConfig}
                disabled={isSubmitting || !isConfigEditable}
                error={errors.personalization}
                onChange={handlePersonalizationChange}
              />
              {!isConfigEditable && (
                <p className="text-sm text-muted-foreground mt-4">
                  La configuración de personalización no puede modificarse porque el producto ya fue activado.
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Gestión de imágenes */}
        {isEditMode && product && (
          <Card>
            <CardHeader>
              <CardTitle>Imágenes</CardTitle>
              <CardDescription>
                Agrega al menos 3 imágenes para poder activar el producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageManager
                productId={product.id}
                projectId={projectId}
                images={images}
                allowedVisualModes={selectedCategory?.allowedVisualModes || ["upload_images"]}
                productStatus={status}
                disabled={isSubmitting}
                error={errors.images}
                onImagesChange={handleImagesChange}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Estado */}
        {isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Estado del producto</CardTitle>
              <CardDescription>
                Define la visibilidad del producto en la tienda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusSection
                status={status}
                imageCount={images.length}
                disabled={isSubmitting}
                error={errors.status}
                onChange={handleStatusChange}
              />
            </CardContent>
          </Card>
        )}
        
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
                {isEditMode ? "Guardar cambios" : "Crear producto"}
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
    </>
  )
}
