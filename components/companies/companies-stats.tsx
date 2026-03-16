import { Building2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TelecomCompany } from '@/lib/types'

interface CompaniesStatsProps {
  companies: TelecomCompany[]
}

export function CompaniesStats({ companies }: CompaniesStatsProps) {
  const activeCount = companies.filter((c) => c.status === 'active').length
  const underReviewCount = companies.filter((c) => c.status === 'under-review').length
  const suspendedCount = companies.filter((c) => c.status === 'suspended').length

  const stats = [
    {
      title: 'Total Registered',
      value: companies.length.toString(),
      icon: Building2,
      description: 'Licensed telecom providers',
    },
    {
      title: 'Active',
      value: activeCount.toString(),
      icon: CheckCircle,
      description: 'Operating normally',
      iconColor: 'text-chart-4',
    },
    {
      title: 'Under Review',
      value: underReviewCount.toString(),
      icon: AlertTriangle,
      description: 'Compliance investigation',
      iconColor: 'text-chart-2',
      alert: underReviewCount > 0,
    },
    {
      title: 'Suspended',
      value: suspendedCount.toString(),
      icon: XCircle,
      description: 'License suspended',
      iconColor: 'text-destructive',
      alert: suspendedCount > 0,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
              <stat.icon className={`h-4 w-4 ${stat.iconColor || 'text-muted-foreground'}`} />
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${stat.alert ? 'text-destructive' : 'text-foreground'}`}>
                {stat.value}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
