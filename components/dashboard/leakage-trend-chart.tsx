'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { MonthlyTrend } from '@/lib/types'

interface LeakageTrendChartProps {
  data: MonthlyTrend[]
  currencySymbol?: string
}

const chartConfig = {
  leakage: {
    label: 'Est. Tax Leakage',
    color: 'var(--color-destructive)',
  },
} satisfies ChartConfig

export function LeakageTrendChart({ data, currencySymbol }: LeakageTrendChartProps) {
  const cs = currencySymbol || '$'
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Tax Leakage Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Estimated revenue loss by month</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Est. Leakage</span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `${cs}${(value / 1000000).toFixed(1)}M`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${cs}${(Number(value) / 1000000).toFixed(2)}M`}
                  />
                }
              />
              <Bar
                dataKey="leakage"
                fill="var(--color-destructive)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
