import { FileText, Download, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ReportsSummaryProps {
  data: {
    totalReports: number
    thisMonth: number
    pending: number
    downloads: number
  }
}

export function ReportsSummary({ data }: ReportsSummaryProps) {
  const stats = [
    {
      title: 'Total Reports Generated',
      value: data.totalReports.toString(),
      icon: FileText,
      description: 'All time',
    },
    {
      title: 'Reports This Month',
      value: data.thisMonth.toString(),
      icon: Clock,
      description: 'Current month',
    },
    {
      title: 'Pending Review',
      value: data.pending.toString(),
      icon: AlertCircle,
      description: 'Awaiting approval',
      alert: data.pending > 0,
    },
    {
      title: 'Total Downloads',
      value: data.downloads.toLocaleString(),
      icon: Download,
      description: 'By authorized users',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
              <stat.icon className={`h-4 w-4 ${stat.alert ? 'text-destructive' : 'text-muted-foreground'}`} />
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
