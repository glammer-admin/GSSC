'use client'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TopProduct } from '@/lib/types/dashboard/organizer'

interface TopProductsChartProps {
  data: TopProduct[]
}

const chartConfig = {
  unitsSold: {
    label: 'Unidades vendidas',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig

/**
 * Gráfica de productos más vendidos (barras horizontales)
 * 
 * Muestra un ranking de productos por unidades vendidas.
 * NO se muestran valores monetarios en esta gráfica (RN-01).
 * La gráfica es informativa y NO interactiva (RN-07).
 */
export function TopProductsChart({ data }: TopProductsChartProps) {
  // Limitar a top 5 y preparar datos para barras horizontales
  const chartData = data.slice(0, 5).map((product) => ({
    name: product.name,
    unitsSold: product.unitsSold,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos más vendidos</CardTitle>
        <CardDescription>
          Top 5 por unidades vendidas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={120}
              tickFormatter={(value) =>
                value.length > 15 ? `${value.slice(0, 15)}...` : value
              }
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value} unidades`}
                />
              }
            />
            <Bar
              dataKey="unitsSold"
              fill="var(--color-primary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

