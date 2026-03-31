'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { RevenueSummaryCards } from '@/components/revenue-intelligence/revenue-summary-cards'
import { ServiceRevenueChart } from '@/components/revenue-intelligence/service-revenue-chart'
import { CompanyRevenueTable } from '@/components/revenue-intelligence/company-revenue-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, Filter, RefreshCw, Download, Loader2 } from 'lucide-react'
import type { RevenueIntelligenceResult } from '@/lib/types'

interface Company {
  id: string
  name: string
}

function generatePeriodOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ label, value })
  }
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
  for (let i = 0; i < 4; i++) {
    let q = currentQuarter - i
    let y = now.getFullYear()
    while (q <= 0) { q += 4; y-- }
    options.push({ label: `Q${q} ${y}`, value: `${y}-q${q}` })
  }
  options.push({ label: `Full Year ${now.getFullYear()}`, value: `${now.getFullYear()}` })
  options.push({ label: `Full Year ${now.getFullYear() - 1}`, value: `${now.getFullYear() - 1}` })
  return options
}

export default function RevenueIntelligencePage() {
  const [results, setResults] = useState<RevenueIntelligenceResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [company, setCompany] = useState('all')
  const [period, setPeriod] = useState('')
  const [billingType, setBillingType] = useState('all')
  const [primaryTaxLabel, setPrimaryTaxLabel] = useState('TVA')
  const [secondaryTaxLabel, setSecondaryTaxLabel] = useState('TICTECH')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const periodOptions = useMemo(() => generatePeriodOptions(), [])

  useEffect(() => {
    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCompanies(data) })
      .catch(() => {})

    fetch('/api/jurisdiction')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.activeConfig) {
          setPrimaryTaxLabel(data.activeConfig.taxes?.primary?.name || 'TVA')
          setSecondaryTaxLabel(data.activeConfig.taxes?.secondary?.name || 'TICTECH')
          setCurrencySymbol(data.activeConfig.currency?.symbol || '$')
        }
      })
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (company && company !== 'all') params.set('companyId', company)
      if (period) params.set('period', period)
      if (billingType && billingType !== 'all') params.set('billingType', billingType)

      const res = await fetch(`/api/revenue-intelligence?${params}`)
      const data = await res.json()
      if (Array.isArray(data)) setResults(data)
    } catch {
      // keep current data
    } finally {
      setIsLoading(false)
    }
  }, [company, period, billingType])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportCSV = () => {
    if (results.length === 0) return
    const headers = ['Company', 'Records', 'Revenue TTC', 'Revenue HT', `Est. ${primaryTaxLabel}`, `Est. ${secondaryTaxLabel}`, 'Total Tax', 'Has Sales Reports']
    const rows = results.map((r) => [
      r.companyName,
      r.recordCount,
      r.totalRevenueTTC.toFixed(2),
      r.totalRevenueHT.toFixed(2),
      r.estimatedTVA.toFixed(2),
      r.estimatedTICTECH.toFixed(2),
      r.totalEstimatedTax.toFixed(2),
      r.hasSalesReports ? 'Yes' : 'No',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-intelligence-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasResults = results.length > 0

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Revenue Intelligence" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Revenue Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              CDR-based revenue analysis and estimated tax obligations
            </p>
          </div>

          <div className="space-y-6">
            {/* Filters */}
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />

                    <Select value={company} onValueChange={setCompany}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Companies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Periods</SelectItem>
                        {periodOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={billingType} onValueChange={setBillingType}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Billing Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="prepaid">Prepaid</SelectItem>
                        <SelectItem value="postpaid">Postpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!hasResults}>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isLoading && !hasResults ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No CDR Data</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Upload CDR records to view revenue intelligence.
                    This page analyzes CDR-based revenue and estimated tax obligations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoading && (
                  <>
                    <RevenueSummaryCards results={results} primaryTaxLabel={primaryTaxLabel} secondaryTaxLabel={secondaryTaxLabel} currencySymbol={currencySymbol} />

                    <div className="grid gap-6 lg:grid-cols-2">
                      <ServiceRevenueChart results={results} currencySymbol={currencySymbol} />
                      <Card className="bg-card">
                        <CardContent className="p-5">
                          <p className="text-sm font-medium text-foreground mb-4">Tax Obligation Summary</p>
                          <div className="space-y-4">
                            {results.map((r) => {
                              const totalTax = r.totalEstimatedTax
                              const maxTax = Math.max(...results.map((x) => x.totalEstimatedTax), 1)
                              const pct = (totalTax / maxTax) * 100
                              return (
                                <div key={r.companyId}>
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-foreground font-medium">{r.companyName}</span>
                                    <span className="font-mono text-muted-foreground">
                                      {totalTax >= 1_000_000 ? `${currencySymbol}${(totalTax / 1_000_000).toFixed(2)}M` : `${currencySymbol}${(totalTax / 1_000).toFixed(1)}K`}
                                    </span>
                                  </div>
                                  <div className="h-2 rounded-full bg-secondary">
                                    <div
                                      className="h-2 rounded-full bg-primary transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <CompanyRevenueTable results={results} secondaryTaxLabel={secondaryTaxLabel} currencySymbol={currencySymbol} />
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
