'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { AnalysisFilters } from '@/components/analysis/analysis-filters'
import { AnalysisTable } from '@/components/analysis/analysis-table'
import { DiscrepancyDetails } from '@/components/analysis/discrepancy-details'
import { ComparisonChart } from '@/components/analysis/comparison-chart'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { AnalysisResult } from '@/lib/types'

export default function AnalysisPage() {
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalysis = useCallback(async (params?: { company?: string; period?: string; riskLevel?: string }) => {
    setIsLoading(true)
    try {
      const searchParams = new URLSearchParams()
      if (params?.company && params.company !== 'all') searchParams.set('companyId', params.company)
      if (params?.period) searchParams.set('period', params.period)
      if (params?.riskLevel && params.riskLevel !== 'all') searchParams.set('riskLevel', params.riskLevel)

      const res = await fetch(`/api/analysis?${searchParams}`)
      const data = await res.json()
      if (Array.isArray(data)) setResults(data)
    } catch {
      // Keep current data
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnalysis() }, [fetchAnalysis])

  const handleExport = () => {
    window.open('/api/reports/export?format=csv', '_blank')
  }

  const hasResults = results.length > 0

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Analysis" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Revenue Discrepancy Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Compare CDR-calculated revenue against reported sales to identify tax leakage
            </p>
          </div>

          <div className="space-y-6">
            <AnalysisFilters onFilter={fetchAnalysis} onExport={handleExport} isLoading={isLoading} />

            {!isLoading && hasResults && results.some(r => r.reportedRevenue === 0) && (
              <div className="flex items-start gap-3 rounded-lg border border-chart-2/30 bg-chart-2/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 text-chart-2 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Some companies have no declared sales reports</p>
                  <p className="mt-1 text-muted-foreground">
                    Their discrepancy appears as 100% because there is no reported revenue to compare against.
                    For CDR-only revenue analysis without discrepancy metrics, visit{' '}
                    <Link href="/revenue-intelligence" className="text-primary underline">Revenue Intelligence</Link>.
                  </p>
                </div>
              </div>
            )}

            {!isLoading && !hasResults ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Analysis Data</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Upload CDR records to run revenue discrepancy analysis.
                    Analysis will compare CDR-calculated revenue against reported figures.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ComparisonChart results={results} />
                  </div>
                  <DiscrepancyDetails results={results} />
                </div>

                <AnalysisTable results={results} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
