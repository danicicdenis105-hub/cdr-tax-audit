'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import type { RiskDistribution } from '@/lib/types'

interface RiskDistributionChartProps {
  data: RiskDistribution[]
}

const chartConfig = {
  low: {
    label: 'Low Risk',
    color: 'var(--color-chart-4)',
  },
  medium: {
    label: 'Medium Risk',
    color: 'var(--color-chart-2)',
  },
  high: {
    label: 'High Risk',
    color: 'var(--color-chart-3)',
  },
  critical: {
    label: 'Critical',
    color: 'var(--color-destructive)',
  },
} satisfies ChartConfig

const COLORS = [
  'var(--color-chart-4)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-destructive)',
]

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Risk Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">Companies by compliance risk level</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
