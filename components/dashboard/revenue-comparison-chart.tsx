'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { MonthlyTrend } from '@/lib/types'

interface RevenueComparisonChartProps {
  data: MonthlyTrend[]
}

const chartConfig = {
  reported: {
    label: 'Reported Revenue',
    color: 'var(--color-chart-1)',
  },
  calculated: {
    label: 'CDR Calculated',
    color: 'var(--color-chart-2)',
  },
} satisfies ChartConfig

export function RevenueComparisonChart({ data }: RevenueComparisonChartProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Revenue Comparison</CardTitle>
          <p className="text-xs text-muted-foreground">Reported vs CDR-calculated revenue over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Reported</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Calculated</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="reportedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="calculatedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `$${(Number(value) / 1000000).toFixed(1)}M`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="reported"
                stroke="var(--color-chart-1)"
                fill="url(#reportedGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="calculated"
                stroke="var(--color-chart-2)"
                fill="url(#calculatedGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
