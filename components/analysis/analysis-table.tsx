'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Flag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from '@/lib/types'

interface AnalysisTableProps {
  results: AnalysisResult[]
}

export function AnalysisTable({ results }: AnalysisTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (companyId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId)
    } else {
      newExpanded.add(companyId)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Detailed Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-3 text-left font-medium"></th>
                <th className="pb-3 text-left font-medium">Company</th>
                <th className="pb-3 text-right font-medium">CDR Revenue</th>
                <th className="pb-3 text-right font-medium">Reported Revenue</th>
                <th className="pb-3 text-right font-medium">Discrepancy</th>
                <th className="pb-3 text-right font-medium">Variance %</th>
                <th className="pb-3 text-right font-medium">Est. Tax Loss</th>
                <th className="pb-3 text-center font-medium">Risk</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const isExpanded = expandedRows.has(result.companyId)
                return (
                  <>
                    <tr key={result.companyId} className="border-b border-border/50 text-sm">
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleRow(result.companyId)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-foreground">{result.companyName}</p>
                          <p className="text-xs text-muted-foreground">{result.period}</p>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono font-medium text-foreground">
                        ${(result.cdrCalculatedRevenue / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        ${(result.reportedRevenue / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 text-right font-mono font-medium text-destructive">
                        ${(result.discrepancy / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'font-mono font-medium',
                            result.discrepancyPercentage > 20
                              ? 'text-destructive'
                              : result.discrepancyPercentage > 10
                              ? 'text-chart-3'
                              : result.discrepancyPercentage > 5
                              ? 'text-chart-2'
                              : 'text-muted-foreground'
                          )}
                        >
                          {result.discrepancyPercentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-medium text-destructive">
                        ${(result.estimatedTaxLeakage / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 text-center">
                        <RiskBadge level={result.riskLevel} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Flag for review">
                            <Flag className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View details">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${result.companyId}-expanded`} className="bg-secondary/30">
                        <td colSpan={9} className="p-4">
                          <div className="grid gap-4 sm:grid-cols-4">
                            <ServiceDetail
                              title="Voice Calls"
                              count={result.callVolumeAnalysis.voice.count}
                              revenue={result.callVolumeAnalysis.voice.revenue}
                            />
                            <ServiceDetail
                              title="SMS Messages"
                              count={result.callVolumeAnalysis.sms.count}
                              revenue={result.callVolumeAnalysis.sms.revenue}
                            />
                            <ServiceDetail
                              title="Data Usage"
                              count={result.callVolumeAnalysis.data.count}
                              revenue={result.callVolumeAnalysis.data.revenue}
                              unit="GB"
                            />
                            <ServiceDetail
                              title="International"
                              count={result.callVolumeAnalysis.international.count}
                              revenue={result.callVolumeAnalysis.international.revenue}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
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

function ServiceDetail({
  title,
  count,
  revenue,
  unit = '',
}: {
  title: string
  count: number
  revenue: number
  unit?: string
}) {
  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="rounded-md bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">
        ${(revenue / 1000000).toFixed(2)}M
      </p>
      <p className="text-xs text-muted-foreground">
        {formatCount(count)} {unit || 'transactions'}
      </p>
    </div>
  )
}
