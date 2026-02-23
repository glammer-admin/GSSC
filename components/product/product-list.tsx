"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Package, ImageIcon, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ProductFilters } from "@/components/product/product-filters"
import { ProductKebabMenu } from "@/components/product/product-kebab-menu"
import type { Product, ProductCategory, ProductStatus } from "@/lib/types/product/types"
import { PRODUCT_STATUS_CONFIG } from "@/lib/types/product/types"

interface ProductListProps {
  products: Product[]
  categories: ProductCategory[]
  projectId: string
}

const STATUS_BADGE_CLASSES: Record<ProductStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-300",
  active: "bg-green-100 text-green-800 border-green-300",
  inactive: "bg-gray-200 text-gray-800 border-gray-400",
}

function filterProducts(
  products: Product[],
  searchQuery: string,
  selectedStatuses: ProductStatus[],
  selectedCategories: string[]
): Product[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  return products.filter((product) => {
    const matchesSearch =
      normalizedQuery.length === 0 || product.name.toLowerCase().includes(normalizedQuery)
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(product.status)
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(product.categoryId)
    return matchesSearch && matchesStatus && matchesCategory
  })
}

export function ProductList({ products, categories, projectId }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<ProductStatus[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const projectCategories = useMemo(() => {
    const categoryIds = new Set(products.map((p) => p.categoryId))
    return categories.filter((c) => categoryIds.has(c.id))
  }, [products, categories])

  const filteredProducts = useMemo(
    () => filterProducts(products, searchQuery, selectedStatuses, selectedCategories),
    [products, searchQuery, selectedStatuses, selectedCategories]
  )

  const hasActiveFilters = selectedStatuses.length > 0 || selectedCategories.length > 0 || searchQuery.trim().length > 0

  function clearFilters() {
    setSearchQuery("")
    setSelectedStatuses([])
    setSelectedCategories([])
  }

  if (products.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Aún no has creado ningún producto para este proyecto.
            Comienza creando tu primer producto.
          </p>
          <Link href={`/project/${projectId}/products/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer producto
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <ProductFilters
        searchQuery={searchQuery}
        selectedStatuses={selectedStatuses}
        selectedCategories={selectedCategories}
        categories={projectCategories}
        onSearchChange={setSearchQuery}
        onStatusChange={setSelectedStatuses}
        onCategoryChange={setSelectedCategories}
        onClear={clearFilters}
      />

      {/* Sin resultados con filtros */}
      {filteredProducts.length === 0 && hasActiveFilters ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <SearchX className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold mb-1">
              No se encontraron productos
            </h3>
            <p className="text-muted-foreground text-center text-sm mb-4 max-w-sm">
              No hay productos que coincidan con los filtros seleccionados.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const statusConfig = PRODUCT_STATUS_CONFIG[product.status]
            const mainImage =
              product.images.find((img) => img.position === 1) || product.images[0]

            return (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow h-full p-0 gap-0"
              >
                <div className="aspect-square bg-muted relative">
                  {mainImage ? (
                    <img
                      src={mainImage.publicUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : product.glamProductImageUrl ? (
                    <img
                      src={product.glamProductImageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={STATUS_BADGE_CLASSES[product.status]}
                    >
                      {statusConfig.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-white text-gray-700 border-gray-200"
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {product.images.length}
                    </Badge>
                  </div>

                  <div className="absolute top-2 right-2">
                    <ProductKebabMenu
                      projectId={projectId}
                      productId={product.id}
                    />
                  </div>
                </div>

                <div className="px-4 pt-3 pb-1">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {product.description || "Sin descripción"}
                  </p>
                </div>

                <div className="px-4 pb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {product.category?.name || "Sin categoría"}
                  </span>
                  <span className="font-semibold">
                    ${product.basePrice.toLocaleString("es-CO")}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
