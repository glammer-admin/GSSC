'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type ProjectStatus,
  PROJECT_STATUS_LABELS,
} from '@/lib/types/dashboard/organizer'

interface ProjectSearchProps {
  query: string
  statusFilter: ProjectStatus | 'all'
  onQueryChange: (query: string) => void
  onStatusFilterChange: (status: ProjectStatus | 'all') => void
  onClear: () => void
}

/**
 * Buscador de proyectos del dashboard
 * 
 * La búsqueda SOLO permite filtrar por proyectos (RN-04):
 * - Por nombre de proyecto
 * - Por estado (activo, pausado, finalizado)
 * 
 * NO permite buscar productos, pedidos ni compradores.
 */
export function ProjectSearch({
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onClear,
}: ProjectSearchProps) {
  const hasActiveFilters = query.length > 0 || statusFilter !== 'all'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar proyectos por nombre..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={(value) => onStatusFilterChange(value as ProjectStatus | 'all')}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="active">{PROJECT_STATUS_LABELS.active}</SelectItem>
          <SelectItem value="paused">{PROJECT_STATUS_LABELS.paused}</SelectItem>
          <SelectItem value="finished">{PROJECT_STATUS_LABELS.finished}</SelectItem>
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  )
}

