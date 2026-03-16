'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Building2, MoreHorizontal, ExternalLink, FileText, AlertTriangle, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TelecomCompany, AnalysisResult } from '@/lib/types'

interface CompaniesTableProps {
  companies: TelecomCompany[]
  analysisResults: AnalysisResult[]
  onUpdate?: () => void
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'bg-chart-4/20 text-chart-4',
  },
  'under-review': {
    label: 'Under Review',
    className: 'bg-chart-2/20 text-chart-2',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-destructive/20 text-destructive',
  },
}

export function CompaniesTable({ companies, analysisResults, onUpdate }: CompaniesTableProps) {
  const { authFetch } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const handleStatusChange = async (companyId: string, status: string) => {
    try {
      await authFetch('/api/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: companyId, status }),
      })
      onUpdate?.()
    } catch { /* ignore */ }
  }

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.region.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCompanyAnalysis = (companyId: string) => {
    return analysisResults.find((r) => r.companyId === companyId)
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Registered Companies</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-3 text-left font-medium">Company</th>
                <th className="pb-3 text-left font-medium">License Number</th>
                <th className="pb-3 text-left font-medium">Region</th>
                <th className="pb-3 text-center font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Latest Revenue</th>
                <th className="pb-3 text-right font-medium">Est. Leakage</th>
                <th className="pb-3 text-center font-medium">Risk</th>
                <th className="pb-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => {
                const analysis = getCompanyAnalysis(company.id)
                return (
                  <tr key={company.id} className="border-b border-border/50 text-sm">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{company.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono text-xs text-muted-foreground">
                      {company.licenseNumber}
                    </td>
                    <td className="py-4 text-muted-foreground">{company.region}</td>
                    <td className="py-4 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                          statusConfig[company.status].className
                        )}
                      >
                        {statusConfig[company.status].label}
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono font-medium text-foreground">
                      {analysis ? `$${(analysis.cdrCalculatedRevenue / 1000000).toFixed(2)}M` : '-'}
                    </td>
                    <td className="py-4 text-right font-mono font-medium text-destructive">
                      {analysis ? `$${(analysis.estimatedTaxLeakage / 1000000).toFixed(2)}M` : '-'}
                    </td>
                    <td className="py-4 text-center">
                      {analysis ? <RiskBadge level={analysis.riskLevel} /> : '-'}
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Reports
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(company.id, 'under-review')}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Flag for Audit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(company.id, 'active')}>Set Active</DropdownMenuItem>
                          <DropdownMenuItem className="text-chart-2" onClick={() => handleStatusChange(company.id, 'suspended')}>Suspend</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCompanies.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No companies found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RiskBadge({ level }: { level: AnalysisResult['riskLevel'] }) {
  const styles = {
    low: 'bg-chart-4/20 text-chart-4',
    medium: 'bg-chart-2/20 text-chart-2',
    high: 'bg-chart-3/20 text-chart-3',
    critical: 'bg-destructive/20 text-destructive',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize',
        styles[level]
      )}
    >
      {level}
    </span>
  )
}
