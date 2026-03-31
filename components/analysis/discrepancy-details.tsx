import { AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from '@/lib/types'

interface DiscrepancyDetailsProps {
  results: AnalysisResult[]
  currencySymbol?: string
}

export function DiscrepancyDetails({ results, currencySymbol }: DiscrepancyDetailsProps) {
  const cs = currencySymbol || '$'
  const totalCDRRevenue = results.reduce((sum, r) => sum + r.cdrCalculatedRevenue, 0)
  const totalReportedRevenue = results.reduce((sum, r) => sum + r.reportedRevenue, 0)
  const totalDiscrepancy = totalCDRRevenue - totalReportedRevenue
  const totalLeakage = results.reduce((sum, r) => sum + r.estimatedTaxLeakage, 0)
  const avgDiscrepancy = (totalDiscrepancy / totalCDRRevenue) * 100

  const criticalCount = results.filter((r) => r.riskLevel === 'critical').length
  const highCount = results.filter((r) => r.riskLevel === 'high').length

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Tax Leakage Alert</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-destructive">
            {cs}{(totalLeakage / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-muted-foreground">Estimated tax revenue loss this period</p>
        </div>

        <div className="space-y-3">
          <StatRow
            label="Total CDR Revenue"
            value={`${cs}${(totalCDRRevenue / 1000000).toFixed(2)}M`}
            icon={TrendingUp}
            iconColor="text-chart-1"
          />
          <StatRow
            label="Total Reported Revenue"
            value={`${cs}${(totalReportedRevenue / 1000000).toFixed(2)}M`}
            icon={TrendingDown}
            iconColor="text-chart-2"
          />
          <StatRow
            label="Revenue Gap"
            value={`${cs}${(totalDiscrepancy / 1000000).toFixed(2)}M`}
            icon={DollarSign}
            iconColor="text-destructive"
            highlight
          />
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Avg. Discrepancy Rate</p>
          <div className="flex items-end gap-2">
            <span className={cn(
              'text-3xl font-bold',
              avgDiscrepancy > 10 ? 'text-destructive' : avgDiscrepancy > 5 ? 'text-chart-2' : 'text-foreground'
            )}>
              {avgDiscrepancy.toFixed(1)}%
            </span>
            <span className="mb-1 text-xs text-muted-foreground">across all companies</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div className="rounded-md bg-destructive/10 p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical Risk</p>
          </div>
          <div className="rounded-md bg-chart-3/10 p-3 text-center">
            <p className="text-2xl font-bold text-chart-3">{highCount}</p>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </div>
        </div>

        <div className="rounded-md bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Recommendation:</strong> Initiate audit proceedings 
            for companies flagged as Critical or High risk. Focus on Data and Voice services 
            where discrepancies are highest.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatRow({
  label,
  value,
  icon: Icon,
  iconColor,
  highlight = false,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center justify-between rounded-md p-2',
      highlight && 'bg-secondary/50'
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={cn(
        'font-mono text-sm font-medium',
        highlight ? 'text-destructive' : 'text-foreground'
      )}>
        {value}
      </span>
    </div>
  )
}
