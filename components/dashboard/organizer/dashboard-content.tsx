'use client'

import { useState, useMemo } from 'react'
import { KpiGrid } from './kpi-grid'
import { PeriodSelector } from './period-selector'
import { CommissionChart } from './commission-chart'
import { OrdersStatusChart } from './orders-status-chart'
import { TopProductsChart } from './top-products-chart'
import { ProjectsTable } from './projects-table'
import { ProjectSearch } from './project-search'
import { EmptyState } from './empty-state'
import { SearchEmptyState } from './search-empty-state'
import { CreateProjectButton } from './create-project-button'
import {
  type Period,
  type ProjectStatus,
  type OrganizerDashboardData,
  DEFAULT_PERIOD,
  PERIOD_LABELS,
} from '@/lib/types/dashboard/organizer'

interface DashboardContentProps {
  data: OrganizerDashboardData
}

/**
 * Contenido principal del dashboard del organizador (Client Component)
 * 
 * Maneja la interactividad:
 * - Filtrado por periodo (mensual, trimestral, semestral)
 * - Búsqueda de proyectos (por nombre y estado)
 * 
 * Recibe los datos desde el Server Component padre.
 */
export function DashboardContent({ data }: DashboardContentProps) {
  // Estado del periodo seleccionado (por defecto: mensual)
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)
  
  // Estado de búsqueda de proyectos
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')

  // Métricas del periodo seleccionado
  const currentMetrics = data.metrics[period]

  // Datos de gráficas del periodo seleccionado
  const commissionData = data.charts.commissionEvolution[period]

  // Proyectos filtrados por búsqueda
  const filteredProjects = useMemo(() => {
    return data.projects.filter((project) => {
      // Filtro por nombre (búsqueda parcial, case-insensitive)
      const matchesQuery = searchQuery.length === 0 || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || 
        project.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [data.projects, searchQuery, statusFilter])

  // Limpiar filtros de búsqueda
  const handleClearSearch = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

  // Estado vacío: sin proyectos
  if (data.projects.length === 0) {
    return <EmptyState />
  }

  const hasActiveFilters = searchQuery.length > 0 || statusFilter !== 'all'
  const hasNoResults = filteredProjects.length === 0 && hasActiveFilters

  return (
    <div className="space-y-8">
      {/* Header con selector de periodo y botón crear */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PeriodSelector value={period} onChange={setPeriod} />
        <CreateProjectButton />
      </div>

      {/* KPIs ejecutivos */}
      <KpiGrid metrics={currentMetrics} />

      {/* Gráficas de tendencias */}
      <div className="grid gap-4 lg:grid-cols-3">
        <CommissionChart 
          data={commissionData} 
          periodLabel={PERIOD_LABELS[period]} 
        />
        <OrdersStatusChart data={data.charts.ordersStatus} />
        <TopProductsChart data={data.charts.topProducts} />
      </div>

      {/* Sección de proyectos */}
      <div className="space-y-4">
        <ProjectSearch
          query={searchQuery}
          statusFilter={statusFilter}
          onQueryChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onClear={handleClearSearch}
        />

        {hasNoResults ? (
          <SearchEmptyState onClear={handleClearSearch} />
        ) : (
          <ProjectsTable projects={filteredProjects} />
        )}
      </div>
    </div>
  )
}

