import { DollarSign, Landmark, Cpu, Calculator } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { RevenueIntelligenceResult } from '@/lib/types'

interface RevenueSummaryCardsProps {
  results: RevenueIntelligenceResult[]
}

export function RevenueSummaryCards({ results }: RevenueSummaryCardsProps) {
  const totalTTC = results.reduce((sum, r) => sum + r.totalRevenueTTC, 0)
  const totalTVA = results.reduce((sum, r) => sum + r.estimatedTVA, 0)
  const totalTICTECH = results.reduce((sum, r) => sum + r.estimatedTICTECH, 0)
  const totalTax = results.reduce((sum, r) => sum + r.totalEstimatedTax, 0)

  const cards = [
    {
      title: 'Total CDR Revenue (TTC)',
      value: totalTTC,
      icon: DollarSign,
      iconColor: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      title: 'Estimated TVA (26%)',
      value: totalTVA,
      icon: Landmark,
      iconColor: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Estimated TICTECH (7%)',
      value: totalTICTECH,
      icon: Cpu,
      iconColor: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: 'Total Tax Obligations',
      value: totalTax,
      icon: Calculator,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  const fmt = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return v.toFixed(0)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
              <div className={`rounded-md p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">${fmt(card.value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {results.length} {results.length === 1 ? 'company' : 'companies'} analyzed
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
