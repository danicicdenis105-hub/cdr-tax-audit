'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { RevenueIntelligenceResult } from '@/lib/types'

interface ServiceRevenueChartProps {
  results: RevenueIntelligenceResult[]
}

const chartConfig = {
  revenueTTC: {
    label: 'Revenue (TTC)',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig

export function ServiceRevenueChart({ results }: ServiceRevenueChartProps) {
  const serviceLabels: Record<string, string> = {
    voice: 'Voice',
    sms: 'SMS',
    data: 'Data',
    international: 'International',
    recharge: 'Recharge',
    subscription: 'Subscriptions',
    roaming: 'Roaming',
  }

  const aggregated: Record<string, { count: number; revenueTTC: number }> = {}
  for (const key of Object.keys(serviceLabels)) {
    aggregated[key] = { count: 0, revenueTTC: 0 }
  }

  for (const result of results) {
    for (const [key, val] of Object.entries(result.serviceBreakdown)) {
      if (aggregated[key]) {
        aggregated[key].count += val.count
        aggregated[key].revenueTTC += val.revenueTTC
      }
    }
  }

  const chartData = Object.entries(aggregated)
    .map(([key, val]) => ({
      service: serviceLabels[key] || key,
      revenueTTC: val.revenueTTC / 1_000_000,
      count: val.count,
    }))
    .filter((d) => d.revenueTTC > 0)
    .sort((a, b) => b.revenueTTC - a.revenueTTC)

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Revenue by Service Type</CardTitle>
        <p className="text-xs text-muted-foreground">CDR-calculated revenue breakdown (in millions)</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `$${value}M`}
              />
              <YAxis
                type="category"
                dataKey="service"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                width={75}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `$${Number(value).toFixed(2)}M`}
                  />
                }
              />
              <Bar dataKey="revenueTTC" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
