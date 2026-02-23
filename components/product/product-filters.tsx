"use client"

import { useState } from "react"
import { X, Search, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PRODUCT_STATUS_CONFIG, type ProductStatus, type ProductCategory } from "@/lib/types/product/types"

interface ProductFiltersProps {
  searchQuery: string
  selectedStatuses: ProductStatus[]
  selectedCategories: string[]
  categories: ProductCategory[]
  onSearchChange: (query: string) => void
  onStatusChange: (statuses: ProductStatus[]) => void
  onCategoryChange: (categories: string[]) => void
  onClear: () => void
}

const STATUS_OPTIONS: ProductStatus[] = ["draft", "active", "inactive"]

export function ProductFilters({
  searchQuery,
  selectedStatuses,
  selectedCategories,
  categories,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onClear,
}: ProductFiltersProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const activeFilterCount = selectedStatuses.length + selectedCategories.length
  const hasActiveFilters = activeFilterCount > 0 || searchQuery.trim().length > 0

  function toggleStatus(status: ProductStatus) {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status))
    } else {
      onStatusChange([...selectedStatuses, status])
    }
  }

  function toggleCategory(categoryId: string) {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter((c) => c !== categoryId))
    } else {
      onCategoryChange([...selectedCategories, categoryId])
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Buscador de productos */}
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Dropdown: Estado */}
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            Estado
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs">
                {selectedStatuses.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {STATUS_OPTIONS.map((status) => {
              const isSelected = selectedStatuses.includes(status)
              return (
                <label
                  key={status}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <span>{PRODUCT_STATUS_CONFIG[status].label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                </label>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Dropdown: Categoría */}
      {categories.length > 0 && (
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              Categoría
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs">
                  {selectedCategories.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <span>{category.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                  </label>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
