/**
 * Tipos del Dashboard del Organizador
 * 
 * Define las estructuras de datos para el dashboard ejecutivo
 * según la especificación en specs/dashboard/provider/spec.md
 */

// Estados válidos de un proyecto (RN-10)
export type ProjectStatus = 'active' | 'paused' | 'finished'

// Etiquetas en español para estados
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  finished: 'Finalizado',
}

// Periodos de análisis disponibles (RN-03)
export type Period = 'monthly' | 'quarterly' | 'biannual'

// Etiquetas en español para periodos
export const PERIOD_LABELS: Record<Period, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  biannual: 'Semestral',
}

// Periodo por defecto
export const DEFAULT_PERIOD: Period = 'monthly'

/**
 * Métricas de un proyecto individual
 */
export interface ProjectMetrics {
  orders: number
  completedOrders: number
  inProgressOrders: number
  unitsSold: number
  commission: number // Solo comisión del organizador (RN-01)
}

/**
 * Proyecto del organizador
 */
export interface Project {
  id: string
  /** Código público para URL de detalle (ej. /dashboard/project/{publicCode}) */
  publicCode: string
  name: string
  status: ProjectStatus
  metrics: ProjectMetrics
}

/**
 * Métricas agregadas del dashboard (RN-02)
 * Valores consolidados de TODOS los proyectos
 */
export interface DashboardMetrics {
  commission: number // Comisión del organizador (RN-01)
  totalOrders: number
  completedOrders: number
  inProgressOrders: number
  productsSold: number // Unidades vendidas, sin valor monetario
}

/**
 * Métricas por periodo
 */
export interface MetricsByPeriod {
  monthly: DashboardMetrics
  quarterly: DashboardMetrics
  biannual: DashboardMetrics
}

/**
 * Punto de datos para gráfica de evolución de comisión
 */
export interface CommissionDataPoint {
  period: string // Ej: "Ene 2024", "Q1 2024"
  value: number
}

/**
 * Datos de estado de pedidos para gráfica pie/donut
 */
export interface OrdersStatusData {
  completed: number
  inProgress: number
}

/**
 * Producto en ranking de más vendidos
 */
export interface TopProduct {
  name: string
  unitsSold: number // Solo unidades, sin valor monetario (RN-01)
}

/**
 * Datos de gráficas por periodo
 */
export interface ChartDataByPeriod {
  commissionEvolution: {
    monthly: CommissionDataPoint[]
    quarterly: CommissionDataPoint[]
    biannual: CommissionDataPoint[]
  }
  ordersStatus: OrdersStatusData
  topProducts: TopProduct[]
}

/**
 * Datos completos del dashboard
 */
export interface OrganizerDashboardData {
  projects: Project[]
  metrics: MetricsByPeriod
  charts: ChartDataByPeriod
}

/**
 * Props para componentes del dashboard
 */
export interface DashboardProps {
  data: OrganizerDashboardData
  initialPeriod?: Period
}

/**
 * Estado del filtro de búsqueda de proyectos
 */
export interface ProjectSearchState {
  query: string
  statusFilter: ProjectStatus | 'all'
}

