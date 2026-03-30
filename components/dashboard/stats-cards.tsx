import { Building2, Database, AlertTriangle, DollarSign, TrendingUp, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatLargeNumber } from '@/lib/utils'
import type { DashboardStats } from '@/lib/types'

interface StatsCardsProps {
  stats: DashboardStats
  currencySymbol?: string
  taxLabel?: string
}

export function StatsCards({ stats, currencySymbol, taxLabel }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies.toString(),
      icon: Building2,
      subtitle: 'Registered operators',
    },
    {
      title: 'CDR Records Analyzed',
      value: formatLargeNumber(stats.totalCDRRecords),
      icon: Database,
      subtitle: stats.totalCDRRecords > 0 ? 'Records processed' : 'No records yet',
    },
    {
      title: 'Est. Tax Leakage',
      value: formatCurrency(stats.totalEstimatedLeakage, currencySymbol),
      icon: DollarSign,
      subtitle: taxLabel || 'TVA + TICTECH',
      alert: stats.totalEstimatedLeakage > 0,
    },
    {
      title: 'High Risk Companies',
      value: stats.highRiskCompanies.toString(),
      icon: AlertTriangle,
      subtitle: stats.highRiskCompanies > 0 ? 'Requires attention' : 'None flagged',
      alert: stats.highRiskCompanies > 0,
    },
    {
      title: 'Compliance Rate',
      value: `${stats.complianceRate}%`,
      icon: CheckCircle,
      subtitle: 'Within threshold',
    },
    {
      title: 'Revenue Discrepancy',
      value: formatCurrency(stats.revenueDiscrepancy, currencySymbol),
      icon: TrendingUp,
      subtitle: 'CDR vs reported totals',
      alert: stats.revenueDiscrepancy > 0,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.alert ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${card.alert ? 'text-destructive' : 'text-foreground'}`}>
                {card.value}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
