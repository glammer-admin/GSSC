'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CommissionDataPoint } from '@/lib/types/dashboard/organizer'

interface CommissionChartProps {
  data: CommissionDataPoint[]
  periodLabel: string
}

const chartConfig = {
  value: {
    label: 'Comisión',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig

/**
 * Gráfica de evolución de comisión del organizador
 * 
 * Muestra la comisión generada a lo largo del tiempo.
 * Solo muestra la comisión del organizador, nunca ventas brutas (RN-01).
 * La gráfica es informativa y NO interactiva (RN-07).
 */
export function CommissionChart({ data, periodLabel }: CommissionChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de comisión</CardTitle>
        <CardDescription>
          Tu comisión generada - Periodo {periodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillCommission" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(value as number)}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#fillCommission)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

