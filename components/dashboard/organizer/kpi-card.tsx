import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  formatAsCurrency?: boolean
}

/**
 * Card individual de KPI para el dashboard del organizador
 * 
 * Muestra métricas clave como comisión, pedidos, productos vendidos.
 * Los KPIs son puramente informativos y no interactivos (RN-07).
 */
export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  formatAsCurrency = false,
}: KpiCardProps) {
  const formattedValue = formatAsCurrency
    ? new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(typeof value === 'number' ? value : parseFloat(value))
    : typeof value === 'number'
      ? value.toLocaleString('es-MX')
      : value

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}% vs periodo anterior
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

