"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
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
import { Separator } from "@/components/ui/separator"
import { CategorySelector } from "./category-selector"
import { GlamProductSelector } from "./glam-product-selector"
import { AttributeSelector } from "./attribute-selector"
import { BasicInfoSection } from "./basic-info-section"
import { PersonalizationConfig } from "./personalization-config"
import { ImageManager } from "./image-manager"
import { StatusSection } from "./status-section"
import { CostSummarySection } from "./cost-summary-section"
import { ConfirmCancelModal } from "./confirm-cancel-modal"
import {
  validateProductName,
  validateProductDescription,
  validateModulesForCategory,
  canActivateProduct,
  buildDefaultPersonalizationConfig,
  ensureAllModulesPresent,
} from "@/lib/types/product/types"
import type {
  Product,
  ProductCategory,
  PersonalizationModule,
  ProductStatus,
  PersonalizationConfig as PersonalizationConfigType,
  ProductImage,
  GlamProduct,
  SelectedAttributes,
} from "@/lib/types/product/types"

interface ProductFormProps {
  projectId: string
  product?: Product
  categories: ProductCategory[]
  modules: PersonalizationModule[]
  isConfigEditable?: boolean
  project?: { commission: number }
}

interface FormErrors {
  category?: string
  glamProduct?: string
  name?: string
  description?: string
  personalization?: string
  images?: string
  status?: string
  attributes?: string
}

export function ProductForm({
  projectId,
  product,
  categories,
  modules,
  isConfigEditable = true,
  project,
}: ProductFormProps) {
  const router = useRouter()
  const isEditMode = !!product

  const [categoryId, setCategoryId] = useState<string | undefined>(product?.categoryId)
  const [name, setName] = useState(product?.name || "")
  const [description, setDescription] = useState(product?.description || "")
  const [basePrice, setBasePrice] = useState<number | undefined>(product?.basePrice)
  const [personalizationConfig, setPersonalizationConfig] = useState<PersonalizationConfigType>(
    product?.personalizationConfig || {}
  )
  const [images, setImages] = useState<ProductImage[]>(product?.images || [])
  const [status, setStatus] = useState<ProductStatus>(product?.status || "draft")
  const [glamProductId, setGlamProductId] = useState<string | undefined>(undefined)
  const [glamProducts, setGlamProducts] = useState<GlamProduct[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showCancelModal, setShowCancelModal] = useState(false)

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === categoryId)
  }, [categories, categoryId])

  const selectedGlamProduct = useMemo(() => {
    return glamProducts.find(gp => gp.id === glamProductId)
  }, [glamProducts, glamProductId])

  const attributesSurcharge = useMemo(() => {
    return Object.values(selectedAttributes).reduce(
      (sum, attr) => sum + (attr.price_modifier ?? 0),
      0,
    )
  }, [selectedAttributes])

  useEffect(() => {
    if (isEditMode || !categoryId) {
      setGlamProducts([])
      setGlamProductId(undefined)
      setSelectedAttributes({})
      return
    }
    let cancelled = false
    fetch(`/api/product?glamProducts=true&categoryId=${encodeURIComponent(categoryId)}`)
      .then((res) => res.json())
      .then((result: { success: boolean; data?: GlamProduct[] }) => {
        if (!cancelled && result.success && result.data?.length) {
          setGlamProducts(result.data)
        } else if (!cancelled) {
          setGlamProducts([])
        }
        if (!cancelled) {
          setGlamProductId(undefined)
          setSelectedAttributes({})
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGlamProducts([])
          setGlamProductId(undefined)
          setSelectedAttributes({})
        }
      })
    return () => { cancelled = true }
  }, [categoryId, isEditMode])

  const initialValues = useMemo(() => ({
    categoryId: product?.categoryId,
    name: product?.name || "",
    description: product?.description || "",
    basePrice: product?.basePrice,
    personalizationConfig: product?.personalizationConfig || {},
    status: product?.status || "draft",
  }), [product])

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
  }, [isEditMode, categoryId, name, description, basePrice, personalizationConfig, status, initialValues])

  const handleCategoryChange = useCallback((newCategoryId: string) => {
    setCategoryId(newCategoryId)
    setGlamProductId(undefined)
    setSelectedAttributes({})
    setBasePrice(undefined)
    const newCategory = categories.find(c => c.id === newCategoryId)
    setPersonalizationConfig(
      newCategory
        ? buildDefaultPersonalizationConfig(newCategory.allowedModules)
        : {}
    )
  }, [categories])

  const handleGlamProductSelect = useCallback((gp: GlamProduct) => {
    setGlamProductId(gp.id)
    setName(gp.name)
    setDescription(gp.description ?? "")
    setBasePrice(gp.basePrice)
    setSelectedAttributes({})
    if (selectedCategory) {
      setPersonalizationConfig(buildDefaultPersonalizationConfig(selectedCategory.allowedModules))
    }
  }, [selectedCategory])

  const handlePersonalizationChange = useCallback((config: PersonalizationConfigType) => {
    setPersonalizationConfig(config)
  }, [])

  const handleImagesChange = useCallback((newImages: ProductImage[]) => {
    setImages(newImages)
  }, [])

  const handleStatusChange = useCallback((newStatus: ProductStatus) => {
    setStatus(newStatus)
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    if (!isEditMode) {
      if (!categoryId) {
        newErrors.category = "Selecciona una categoría"
        isValid = false
      } else if (!glamProductId) {
        newErrors.glamProduct = "Selecciona un producto del catálogo"
        isValid = false
      }
    }

    const nameValidation = validateProductName(name)
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error
      isValid = false
    }

    const descriptionValidation = validateProductDescription(description)
    if (!descriptionValidation.valid) {
      newErrors.description = descriptionValidation.error
      isValid = false
    }

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

    if (status === "active") {
      const effectivePrice = basePrice ?? product?.basePrice ?? 0
      const activationCheck = canActivateProduct(
        { name, basePrice: effectivePrice },
        images.length
      )
      if (!activationCheck.valid) {
        newErrors.status = activationCheck.errors[0]
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }, [categoryId, glamProductId, name, description, basePrice, product?.basePrice, selectedCategory, personalizationConfig, status, images.length, isEditMode])

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

      const priceForSubmit = basePrice ?? product?.basePrice ?? 0
      const fullPersonalizationConfig = selectedCategory
        ? ensureAllModulesPresent(personalizationConfig, selectedCategory.allowedModules)
        : personalizationConfig
      const bodyData = isEditMode
        ? {
            name: name.trim(),
            description: description.trim(),
            basePrice: priceForSubmit,
            status,
          }
        : {
            projectId,
            glamProductId: glamProductId!,
            name: name.trim(),
            description: description.trim(),
            price: priceForSubmit,
            personalizationConfig: fullPersonalizationConfig,
            selectedAttributes,
          }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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

      router.push(`/project/${projectId}/products`)
      router.refresh()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el producto"
      )
      setIsSubmitting(false)
    }
  }

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

  const productSelected = isEditMode || glamProductId !== undefined
  const hasAttributes = selectedGlamProduct
    ? Object.keys(selectedGlamProduct.attributesConfig).length > 0
    : false

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
            <CardDescription>
              Nombre y descripción del producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BasicInfoSection
              name={name}
              description={description}
              disabled={isSubmitting}
              errors={{ name: errors.name, description: errors.description }}
              onNameChange={setName}
              onDescriptionChange={setDescription}
            />
          </CardContent>
        </Card>

        {/* Categoría → Producto → Atributos → Personalización */}
        <Card>
          <CardHeader>
            <CardTitle>Categoría y producto</CardTitle>
            <CardDescription>
              Selecciona la categoría, luego elige un producto del catálogo para configurar sus atributos y personalización.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paso 1: Categoría */}
            <CategorySelector
              categories={categories}
              selectedCategoryId={categoryId}
              disabled={isSubmitting || (isEditMode && !isConfigEditable)}
              error={errors.category}
              onChange={handleCategoryChange}
            />

            {/* Paso 2: Productos del catálogo */}
            {!isEditMode && categoryId && glamProducts.length > 0 && (
              <>
                <Separator />
                <GlamProductSelector
                  products={glamProducts}
                  selectedId={glamProductId}
                  disabled={isSubmitting}
                  onSelect={handleGlamProductSelect}
                />
              </>
            )}
            {errors.glamProduct && (
              <p className="text-sm text-destructive">{errors.glamProduct}</p>
            )}

            {/* Paso 3: Atributos (solo si el producto tiene attributes_config) */}
            {productSelected && hasAttributes && selectedGlamProduct && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Atributos del producto</h4>
                  <p className="text-xs text-muted-foreground">
                    Selecciona los atributos para este producto. Algunos atributos pueden tener un valor adicional.
                  </p>
                  <AttributeSelector
                    attributesConfig={selectedGlamProduct.attributesConfig}
                    selectedAttributes={selectedAttributes}
                    disabled={isSubmitting || (isEditMode && !isConfigEditable)}
                    onChange={setSelectedAttributes}
                  />
                </div>
              </>
            )}

            {/* Paso 4: Personalización */}
            {selectedCategory && productSelected && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Personalización</h4>
                  <p className="text-xs text-muted-foreground">
                    Configura las opciones de personalización disponibles para el comprador. Estas opciones no afectan el precio del producto.
                  </p>
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
                </div>
              </>
            )}
          </CardContent>
        </Card>

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

        {/* Precio tentativo (solo lectura) - RN-41: muestra $0 si no hay producto seleccionado */}
        {project && (
          <Card>
            <CardHeader>
              <CardTitle>Precio tentativo del producto</CardTitle>
              <CardDescription>
                {glamProductId || isEditMode
                  ? "Detalle del precio base, recargos por atributos, comisión del proyecto, IVA y total aproximado."
                  : "Selecciona un producto del catálogo para ver el desglose de precio."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostSummarySection
                basePrice={basePrice ?? 0}
                attributesSurcharge={attributesSurcharge}
                commissionPercent={project.commission}
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

      <ConfirmCancelModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onConfirm={handleConfirmCancel}
      />
    </>
  )
}
