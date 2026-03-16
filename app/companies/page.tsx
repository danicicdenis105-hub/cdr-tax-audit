'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { CompaniesTable } from '@/components/companies/companies-table'
import { CompaniesStats } from '@/components/companies/companies-stats'
import { AddCompanyDialog } from '@/components/companies/add-company-dialog'
import type { TelecomCompany, AnalysisResult } from '@/lib/types'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<TelecomCompany[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [companiesRes, analysisRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/analysis'),
      ])
      const companiesData = await companiesRes.json()
      const analysisData = await analysisRes.json()

      if (Array.isArray(companiesData)) setCompanies(companiesData)
      if (Array.isArray(analysisData)) setAnalysisResults(analysisData)
    } catch {
      // Keep defaults
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Companies" />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Telecom Companies</h2>
              <p className="text-sm text-muted-foreground">
                Manage registered telecommunications providers and their compliance status
              </p>
            </div>
            <AddCompanyDialog onCompanyAdded={fetchData} />
          </div>

          <div className="space-y-6">
            <CompaniesStats companies={companies} />
            <CompaniesTable companies={companies} analysisResults={analysisResults} onUpdate={fetchData} />
          </div>
        </main>
      </div>
    </div>
  )
}
