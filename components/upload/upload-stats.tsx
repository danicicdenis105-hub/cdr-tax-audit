'use client'

import { useEffect, useState } from 'react'
import { Upload, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface UploadStatsData {
  totalUploads: number
  totalRecords: number
  completedUploads: number
  failedUploads: number
}

export function UploadStats() {
  const [stats, setStats] = useState<UploadStatsData>({
    totalUploads: 0,
    totalRecords: 0,
    completedUploads: 0,
    failedUploads: 0,
  })

  const fetchStats = () => {
    fetch('/api/upload')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchStats()
    const handler = () => fetchStats()
    window.addEventListener('cdr-upload-complete', handler)
    return () => window.removeEventListener('cdr-upload-complete', handler)
  }, [])

  const cards = [
    {
      title: 'Total Uploads',
      value: stats.totalUploads.toLocaleString(),
      icon: Upload,
      description: 'CDR files processed',
    },
    {
      title: 'Total Records',
      value: stats.totalRecords >= 1000000
        ? `${(stats.totalRecords / 1000000).toFixed(1)}M`
        : stats.totalRecords.toLocaleString(),
      icon: Database,
      description: 'CDR records in database',
    },
    {
      title: 'Successful',
      value: stats.completedUploads.toLocaleString(),
      icon: CheckCircle,
      description: 'Completed uploads',
      iconColor: 'text-chart-4',
    },
    {
      title: 'Failed',
      value: stats.failedUploads.toLocaleString(),
      icon: AlertCircle,
      description: 'Failed uploads',
      iconColor: 'text-destructive',
      alert: stats.failedUploads > 0,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => (
        <Card key={card.title} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.iconColor || 'text-muted-foreground'}`} />
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${card.alert ? 'text-destructive' : 'text-foreground'}`}>
                {card.value}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
