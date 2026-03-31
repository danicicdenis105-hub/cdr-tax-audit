'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RevenueComparisonChart } from '@/components/dashboard/revenue-comparison-chart'
import { LeakageTrendChart } from '@/components/dashboard/leakage-trend-chart'
import { RiskDistributionChart } from '@/components/dashboard/risk-distribution-chart'
import { CompanyAnalysisTable } from '@/components/dashboard/company-analysis-table'
import { ServiceBreakdownChart } from '@/components/dashboard/service-breakdown-chart'
import { Card, CardContent } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import type { DashboardStats, AnalysisResult, MonthlyTrend, RiskDistribution, ServiceTypeBreakdown } from '@/lib/types'

const emptyStats: DashboardStats = {
  totalCompanies: 0, totalCDRRecords: 0, totalEstimatedLeakage: 0,
  highRiskCompanies: 0, complianceRate: 100, revenueDiscrepancy: 0,
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [trends, setTrends] = useState<MonthlyTrend[]>([])
  const [risk, setRisk] = useState<RiskDistribution[]>([])
  const [service, setService] = useState<ServiceTypeBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currencySymbol, setCurrencySymbol] = useState<string>('FCFA')
  const [taxLabel, setTaxLabel] = useState<string>('TVA + TICTECH')

  useEffect(() => {
    fetch('/api/jurisdiction')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.activeConfig) {
          setCurrencySymbol(data.activeConfig.currency.symbol)
          setTaxLabel(`${data.activeConfig.taxes.primary.code} + ${data.activeConfig.taxes.secondary.code}`)
        }
      })
      .catch(() => {})

    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats)
        if (data.analysisResults) setResults(data.analysisResults)
        if (data.monthlyTrends) setTrends(data.monthlyTrends)
        if (data.riskDistribution) setRisk(data.riskDistribution)
        if (data.serviceBreakdown) setService(data.serviceBreakdown)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const hasData = stats.totalCDRRecords > 0

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Dashboard" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tax Leakage Overview</h2>
            <p className="text-sm text-muted-foreground">
              Monitor telecommunications revenue and detect discrepancies between CDR data and reported sales
            </p>
          </div>

          <div className="space-y-6">
            <StatsCards stats={stats} currencySymbol={currencySymbol} taxLabel={taxLabel} />

            {!isLoading && !hasData ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No CDR Data Yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Upload CDR files from telecom operators to begin analysis.
                    Go to <a href="/upload" className="text-primary underline">Upload CDR Data</a> to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <RevenueComparisonChart data={trends} currencySymbol={currencySymbol} />
                  <LeakageTrendChart data={trends} currencySymbol={currencySymbol} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ServiceBreakdownChart data={service} currencySymbol={currencySymbol} />
                  </div>
                  <RiskDistributionChart data={risk} />
                </div>

                <CompanyAnalysisTable results={results} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
