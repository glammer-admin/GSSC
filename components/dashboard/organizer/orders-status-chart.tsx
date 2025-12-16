'use client'

import { Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrdersStatusData } from '@/lib/types/dashboard/organizer'

interface OrdersStatusChartProps {
  data: OrdersStatusData
}

const chartConfig = {
  completed: {
    label: 'Completados',
    color: 'hsl(142.1 76.2% 36.3%)', // emerald-600
  },
  inProgress: {
    label: 'En proceso',
    color: 'hsl(45.4 93.4% 47.5%)', // amber-500
  },
} satisfies ChartConfig

/**
 * Gráfica de estado de pedidos (pie/donut)
 * 
 * Muestra la distribución de pedidos por estado:
 * - Completados: Entregados exitosamente
 * - En proceso: Pendientes de entrega
 * 
 * La gráfica es informativa y NO interactiva (RN-07).
 */
export function OrdersStatusChart({ data }: OrdersStatusChartProps) {
  const chartData = [
    { name: 'completed', value: data.completed, fill: chartConfig.completed.color },
    { name: 'inProgress', value: data.inProgress, fill: chartConfig.inProgress.color },
  ]

  const total = data.completed + data.inProgress
  const completedPercent = total > 0 ? Math.round((data.completed / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de pedidos</CardTitle>
        <CardDescription>
          {completedPercent}% tasa de completados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[280px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

