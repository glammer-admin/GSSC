/**
 * Funciones para cargar datos mock del dashboard del organizador
 * 
 * Estas funciones simulan las respuestas del backend durante el desarrollo.
 * Serán reemplazadas por llamadas HTTP reales en el futuro.
 */

import type {
  Project,
  MetricsByPeriod,
  ChartDataByPeriod,
  OrganizerDashboardData,
} from '@/lib/types/dashboard/organizer'

import projectsData from '@/mocks/dashboard/organizer/projects.json'
import metricsData from '@/mocks/dashboard/organizer/metrics.json'
import chartsData from '@/mocks/dashboard/organizer/charts.json'

/**
 * Carga la lista de proyectos del organizador
 */
export function loadProjects(): Project[] {
  return projectsData.projects as Project[]
}

/**
 * Carga las métricas agregadas por periodo
 */
export function loadMetrics(): MetricsByPeriod {
  return metricsData as MetricsByPeriod
}

/**
 * Carga los datos de gráficas
 */
export function loadChartData(): ChartDataByPeriod {
  return chartsData as ChartDataByPeriod
}

/**
 * Carga todos los datos del dashboard del organizador
 */
export function loadOrganizerDashboardData(): OrganizerDashboardData {
  return {
    projects: loadProjects(),
    metrics: loadMetrics(),
    charts: loadChartData(),
  }
}

/**
 * Simula un escenario de organizador sin proyectos
 * Útil para probar el estado vacío
 */
export function loadEmptyDashboardData(): OrganizerDashboardData {
  return {
    projects: [],
    metrics: {
      monthly: {
        commission: 0,
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        productsSold: 0,
      },
      quarterly: {
        commission: 0,
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        productsSold: 0,
      },
      biannual: {
        commission: 0,
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        productsSold: 0,
      },
    },
    charts: {
      commissionEvolution: {
        monthly: [],
        quarterly: [],
        biannual: [],
      },
      ordersStatus: {
        completed: 0,
        inProgress: 0,
      },
      topProducts: [],
    },
  }
}

