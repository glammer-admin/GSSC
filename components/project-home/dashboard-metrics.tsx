import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  Package,
  DollarSign,
  Percent,
  Wallet,
  Smile,
  Star,
  TrendingUp,
  MessageSquare,
} from "lucide-react"

interface ProjectSalesMetrics {
  ordersCount: number
  unitsSold: number
  organizerCommissionTotal: number
  currency: string | null
  lastSaleAt: string | null
}

interface DashboardMetricsProps {
  metrics: ProjectSalesMetrics
  commissionPercent: number
}

/**
 * Componente de métricas del dashboard del proyecto
 *
 * Muestra:
 * - Métricas reales: órdenes, unidades, comisión, neto
 * - Métricas placeholder: satisfacción, NPS, ratings, tendencias
 */
export function DashboardMetrics({
  metrics,
  commissionPercent,
}: DashboardMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: metrics.currency || "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sin ventas"
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr))
  }

  return (
    <div className="space-y-6">
      {/* Título de la sección */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Resumen del proyecto
        </h2>
        <p className="text-muted-foreground mt-1">
          Métricas de rendimiento y ventas
        </p>
      </div>

      {/* Métricas reales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Órdenes pagadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes pagadas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ordersCount}</div>
            <p className="text-xs text-muted-foreground">
              Última venta: {formatDate(metrics.lastSaleAt)}
            </p>
          </CardContent>
        </Card>

        {/* Unidades vendidas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades vendidas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.unitsSold}</div>
            <p className="text-xs text-muted-foreground">
              Total de productos vendidos
            </p>
          </CardContent>
        </Card>

        {/* Comisión acumulada */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tu comisión</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.organizerCommissionTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissionPercent}% sobre ventas
            </p>
          </CardContent>
        </Card>

        {/* Neto estimado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neto estimado</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.organizerCommissionTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponible para retiro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas placeholder */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-medium">Métricas avanzadas</h3>
          <Badge variant="secondary" className="text-xs">
            Próximamente
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Satisfacción */}
          <Card className="opacity-60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">--</div>
              <p className="text-xs text-muted-foreground">
                Índice de satisfacción
              </p>
            </CardContent>
          </Card>

          {/* NPS */}
          <Card className="opacity-60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">--</div>
              <p className="text-xs text-muted-foreground">
                Net Promoter Score
              </p>
            </CardContent>
          </Card>

          {/* Ratings */}
          <Card className="opacity-60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valoración</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">--</div>
              <p className="text-xs text-muted-foreground">
                Puntuación promedio
              </p>
            </CardContent>
          </Card>

          {/* Tendencias */}
          <Card className="opacity-60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tendencia</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">--</div>
              <p className="text-xs text-muted-foreground">
                Crecimiento mensual
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
