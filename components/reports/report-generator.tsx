'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { FileText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: string
  name: string
}

interface ReportGeneratorProps {
  onGenerated?: () => void
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

export function ReportGenerator({ onGenerated }: ReportGeneratorProps) {
  const { authFetch } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [reportType, setReportType] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const periodOptions = useMemo(() => generatePeriodOptions(), [])

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCompanies(data) })
      .catch(() => {})
  }, [])

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([])
    } else {
      setSelectedCompanies(companies.map((c) => c.id))
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setMessage('')

    try {
      const res = await authFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          period,
          companyIds: selectedCompanies,
        }),
      })

      if (res.ok) {
        setMessage('Report generated successfully!')
        setReportType('')
        setPeriod('')
        setSelectedCompanies([])
        onGenerated?.()
        setTimeout(() => setMessage(''), 3000)
      } else {
        const err = await res.json()
        setMessage(err.error || 'Failed to generate report')
      }
    } catch {
      setMessage('Network error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Generate New Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Report Type</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly Analysis</SelectItem>
              <SelectItem value="quarterly">Quarterly Summary</SelectItem>
              <SelectItem value="audit">Audit Report</SelectItem>
              <SelectItem value="comparison">Year-over-Year Comparison</SelectItem>
              <SelectItem value="custom">Custom Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Period</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Companies</label>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={handleSelectAll}>
              {selectedCompanies.length === companies.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border p-3">
            {companies.map((company) => (
              <div key={company.id} className="flex items-center gap-2">
                <Checkbox
                  id={`company-${company.id}`}
                  checked={selectedCompanies.includes(company.id)}
                  onCheckedChange={() => handleCompanyToggle(company.id)}
                />
                <label htmlFor={`company-${company.id}`} className="text-sm text-foreground cursor-pointer">
                  {company.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.includes('success') ? 'text-chart-4' : 'text-destructive'}`}>{message}</p>
        )}

        <Button
          className="w-full"
          disabled={!reportType || !period || selectedCompanies.length === 0 || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
          ) : (
            <><FileText className="mr-2 h-4 w-4" />Generate Report</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Reports are generated and stored securely
        </p>
      </CardContent>
    </Card>
  )
}
