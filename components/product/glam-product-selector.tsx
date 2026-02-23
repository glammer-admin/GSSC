"use client"

import { Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GlamProduct } from "@/lib/types/product/types"

interface GlamProductSelectorProps {
  products: GlamProduct[]
  selectedId?: string
  disabled?: boolean
  onSelect: (product: GlamProduct) => void
}

/**
 * Lista de productos del catálogo con nombre, descripción e imagen.
 * El usuario debe seleccionar uno para continuar con la personalización.
 */
export function GlamProductSelector({
  products,
  selectedId,
  disabled = false,
  onSelect,
}: GlamProductSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Elige un producto del catálogo. Luego podrás configurar las opciones de personalización.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isSelected = selectedId === product.id
          return (
            <button
              key={product.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(product)}
              className={cn(
                "flex flex-col rounded-lg border-2 bg-card text-left transition-colors",
                "hover:border-primary/50 hover:bg-accent/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted"
              )}
            >
              {/* Imagen o placeholder */}
              <div className="aspect-square w-full overflow-hidden rounded-t-md bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Package className="h-16 w-16" strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="font-semibold leading-tight">{product.name}</span>
                {product.description && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {product.description}
                  </span>
                )}
                <span className="mt-1 text-sm font-medium text-foreground">
                  ${product.basePrice.toLocaleString("es-CO")}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
