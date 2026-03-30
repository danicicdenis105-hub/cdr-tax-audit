'use client'

import { useState, Fragment } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RevenueIntelligenceResult } from '@/lib/types'

interface CompanyRevenueTableProps {
  results: RevenueIntelligenceResult[]
}

const fmt = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

const fmtCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function CompanyRevenueTable({ results }: CompanyRevenueTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (companyId: string) => {
    const next = new Set(expandedRows)
    if (next.has(companyId)) next.delete(companyId)
    else next.add(companyId)
    setExpandedRows(next)
  }

  const serviceLabels: Record<string, string> = {
    voice: 'Voice',
    sms: 'SMS',
    data: 'Data',
    international: 'International',
    recharge: 'Recharge',
    subscription: 'Subscriptions',
    roaming: 'Roaming',
    mobileMoney: 'Mobile Money / USSD',
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Company Revenue Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-3 text-left font-medium w-8"></th>
                <th className="pb-3 text-left font-medium">Company</th>
                <th className="pb-3 text-right font-medium">Records</th>
                <th className="pb-3 text-right font-medium">Revenue TTC</th>
                <th className="pb-3 text-right font-medium">Revenue HT</th>
                <th className="pb-3 text-right font-medium">Est. TVA</th>
                <th className="pb-3 text-right font-medium">Est. TICTECH</th>
                <th className="pb-3 text-right font-medium">Total Tax</th>
                <th className="pb-3 text-center font-medium">Sales Data</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const isExpanded = expandedRows.has(r.companyId)
                return (
                  <Fragment key={r.companyId}>
                    <tr className="border-b border-border/50 text-sm">
                      <td className="py-3">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRow(r.companyId)}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-foreground">{r.companyName}</p>
                        <p className="text-xs text-muted-foreground">{r.period}</p>
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">{fmtCount(r.recordCount)}</td>
                      <td className="py-3 text-right font-mono font-medium text-foreground">{fmt(r.totalRevenueTTC)}</td>
                      <td className="py-3 text-right font-mono text-muted-foreground">{fmt(r.totalRevenueHT)}</td>
                      <td className="py-3 text-right font-mono text-chart-2">{fmt(r.estimatedTVA)}</td>
                      <td className="py-3 text-right font-mono text-chart-3">{fmt(r.estimatedTICTECH)}</td>
                      <td className="py-3 text-right font-mono font-medium text-primary">{fmt(r.totalEstimatedTax)}</td>
                      <td className="py-3 text-center">
                        {r.hasSalesReports ? (
                          <span className="inline-flex items-center rounded-full bg-chart-4/20 text-chart-4 px-2 py-1 text-xs font-medium">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                            CDR Only
                          </span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-secondary/30">
                        <td colSpan={9} className="p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-3">Service Breakdown</p>
                          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
                            {Object.entries(r.serviceBreakdown).map(([key, val]) => (
                              val.count > 0 && (
                                <div key={key} className="rounded-md bg-card p-3">
                                  <p className="text-xs font-medium text-muted-foreground">{serviceLabels[key] || key}</p>
                                  <p className="mt-1 text-lg font-semibold text-foreground">{fmt(val.revenueTTC)}</p>
                                  <p className="text-xs text-muted-foreground">{fmtCount(val.count)} records</p>
                                </div>
                              )
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {results.some((r) => r.hasSalesReports) && (
          <div className="mt-4 flex items-start gap-2 rounded-md bg-chart-1/10 p-3">
            <Info className="mt-0.5 h-4 w-4 text-chart-1 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Companies with available sales data can also be analyzed on the{' '}
              <a href="/analysis" className="text-primary underline">Discrepancy Analysis</a> page
              for comparison against declared revenue.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
