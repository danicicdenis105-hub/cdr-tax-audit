'use client'

import { FileText, Download, Eye, MoreHorizontal, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ReportData {
  id: string
  title: string
  type: 'monthly' | 'quarterly' | 'audit' | 'custom'
  period: string
  createdAt: string
  status: 'completed' | 'pending' | 'draft'
  fileSize: string
  companyCount: number
  estimatedLeakage: number
}

interface ReportsListProps {
  reports: ReportData[]
  onRefresh?: () => void
}

const typeColors: Record<string, string> = {
  monthly: 'bg-chart-1/20 text-chart-1',
  quarterly: 'bg-chart-4/20 text-chart-4',
  audit: 'bg-destructive/20 text-destructive',
  custom: 'bg-chart-2/20 text-chart-2',
  comparison: 'bg-chart-5/20 text-chart-5',
}

const statusConfig = {
  completed: { icon: CheckCircle, label: 'Completed', className: 'text-chart-4' },
  pending: { icon: Clock, label: 'Pending Review', className: 'text-chart-2' },
  draft: { icon: AlertCircle, label: 'Draft', className: 'text-muted-foreground' },
}

export function ReportsList({ reports, onRefresh }: ReportsListProps) {
  const handleDownload = (report: ReportData, format: 'csv' | 'pdf' = 'csv') => {
    if (format === 'pdf') {
      window.open(`/api/reports/export/pdf?period=${report.period}`, '_blank')
    } else {
      window.open(`/api/reports/export?format=csv&period=${report.period}`, '_blank')
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Generated Reports</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onRefresh}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No reports generated yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const config = statusConfig[report.status] || statusConfig.draft
              const StatusIcon = config.icon
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-md border border-border/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{report.title}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          typeColors[report.type] || typeColors.custom
                        )}>
                          {report.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{report.period}</span>
                        <span className="text-xs text-muted-foreground">{report.fileSize}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">
                        ${(report.estimatedLeakage / 1000000).toFixed(2)}M
                      </p>
                      <div className={cn('flex items-center justify-end gap-1 text-xs', config.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Download" onClick={() => handleDownload(report)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(report, 'pdf')}>
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(report, 'csv')}>
                            Download CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/api/reports/export?format=json&period=${report.period}`, '_blank')}>
                            Export JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
