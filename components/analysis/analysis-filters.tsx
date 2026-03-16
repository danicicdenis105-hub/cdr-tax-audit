'use client'

import { useState, useEffect, useMemo } from 'react'
import { Filter, Download, RefreshCw, Loader2, FileText, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Company {
  id: string
  name: string
}

interface AnalysisFiltersProps {
  onFilter: (params: { company?: string; period?: string; riskLevel?: string }) => void
  onExport: () => void
  isLoading: boolean
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

export function AnalysisFilters({ onFilter, onExport, isLoading }: AnalysisFiltersProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [company, setCompany] = useState<string>('all')
  const [period, setPeriod] = useState<string>('')
  const [riskLevel, setRiskLevel] = useState<string>('all')
  const periodOptions = useMemo(() => generatePeriodOptions(), [])

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCompanies(data) })
      .catch(() => {})
  }, [])

  const handleRunAnalysis = () => {
    onFilter({ company, period, riskLevel })
  }

  return (
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

            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onFilter({ company, period, riskLevel })} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExport}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/api/reports/export/pdf', '_blank')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/api/reports/export?format=json', '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={handleRunAnalysis} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Analysis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
