'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { ReportsList } from '@/components/reports/reports-list'
import { ReportGenerator } from '@/components/reports/report-generator'
import { ReportsSummary } from '@/components/reports/reports-summary'

interface ReportSummary {
  totalReports: number
  thisMonth: number
  pending: number
  downloads: number
}

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

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [summary, setSummary] = useState<ReportSummary>({ totalReports: 0, thisMonth: 0, pending: 0, downloads: 0 })

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      if (data.reports) setReports(data.reports)
      if (data.summary) setSummary(data.summary)
    } catch {
      // Keep defaults
    }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Reports" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tax Leakage Reports</h2>
            <p className="text-sm text-muted-foreground">
              Generate, view, and export detailed tax compliance reports
            </p>
          </div>

          <div className="space-y-6">
            <ReportsSummary data={summary} />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ReportsList reports={reports} onRefresh={fetchReports} />
              </div>
              <ReportGenerator onGenerated={fetchReports} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
