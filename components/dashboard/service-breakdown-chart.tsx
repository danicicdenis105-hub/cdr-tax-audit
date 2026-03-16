'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { ServiceTypeBreakdown } from '@/lib/types'

interface ServiceBreakdownChartProps {
  data: ServiceTypeBreakdown[]
}

const chartConfig = {
  cdrRevenue: {
    label: 'CDR Revenue',
    color: 'var(--color-chart-1)',
  },
  reportedRevenue: {
    label: 'Reported Revenue',
    color: 'var(--color-chart-2)',
  },
} satisfies ChartConfig

export function ServiceBreakdownChart({ data }: ServiceBreakdownChartProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Service Type Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue comparison by telecommunications type</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">CDR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Reported</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <YAxis
                dataKey="type"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                width={80}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `$${(Number(value) / 1000000).toFixed(1)}M`}
                  />
                }
              />
              <Bar dataKey="cdrRevenue" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} barSize={20} />
              <Bar dataKey="reportedRevenue" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
