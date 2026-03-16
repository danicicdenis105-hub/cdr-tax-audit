'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { AnalysisResult } from '@/lib/types'

interface ComparisonChartProps {
  results: AnalysisResult[]
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

export function ComparisonChart({ results }: ComparisonChartProps) {
  const chartData = results.map((r) => ({
    name: r.companyName.split(' ')[0],
    fullName: r.companyName,
    cdrRevenue: r.cdrCalculatedRevenue / 1000000,
    reportedRevenue: r.reportedRevenue / 1000000,
    discrepancy: r.discrepancy / 1000000,
  }))

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">CDR vs Reported Revenue</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue comparison by company (in millions)</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">CDR Calculated</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Reported</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `$${value}M`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullName
                      }
                      return ''
                    }}
                    formatter={(value) => `$${Number(value).toFixed(2)}M`}
                  />
                }
              />
              <ReferenceLine y={0} stroke="var(--color-border)" />
              <Bar dataKey="cdrRevenue" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="reportedRevenue" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
