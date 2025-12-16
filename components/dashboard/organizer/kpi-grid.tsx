import {
  DollarSign,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react'
import { KpiCard } from './kpi-card'
import type { DashboardMetrics } from '@/lib/types/dashboard/organizer'

interface KpiGridProps {
  metrics: DashboardMetrics
}

/**
 * Grid de KPIs ejecutivos del dashboard del organizador
 * 
 * Muestra las métricas agregadas de todos los proyectos (RN-02):
 * - Comisión generada (solo comisión del organizador, RN-01)
 * - Pedidos totales
 * - Pedidos completados
 * - Pedidos en proceso
 * - Productos vendidos (unidades, sin valor monetario)
 */
export function KpiGrid({ metrics }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        title="Comisión generada"
        value={metrics.commission}
        icon={DollarSign}
        formatAsCurrency
        description="Tu comisión del periodo"
      />
      <KpiCard
        title="Pedidos totales"
        value={metrics.totalOrders}
        icon={ShoppingCart}
        description="Todos los proyectos"
      />
      <KpiCard
        title="Completados"
        value={metrics.completedOrders}
        icon={CheckCircle2}
        description="Entregados exitosamente"
      />
      <KpiCard
        title="En proceso"
        value={metrics.inProgressOrders}
        icon={Clock}
        description="Pendientes de entrega"
      />
      <KpiCard
        title="Productos vendidos"
        value={metrics.productsSold}
        icon={Package}
        description="Unidades totales"
      />
    </div>
  )
}

