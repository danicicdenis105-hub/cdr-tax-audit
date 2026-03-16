'use client'

import { ArrowUpRight, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from '@/lib/types'

interface CompanyAnalysisTableProps {
  results: AnalysisResult[]
}

export function CompanyAnalysisTable({ results }: CompanyAnalysisTableProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-medium">Company Analysis Overview</CardTitle>
          <p className="text-xs text-muted-foreground">CDR vs reported revenue comparison by telecom provider</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/analysis">
            View All
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-3 text-left font-medium">Company</th>
                <th className="pb-3 text-right font-medium">CDR Revenue</th>
                <th className="pb-3 text-right font-medium">Reported</th>
                <th className="pb-3 text-right font-medium">Discrepancy</th>
                <th className="pb-3 text-right font-medium">Est. Leakage</th>
                <th className="pb-3 text-center font-medium">Risk</th>
                <th className="pb-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.companyId} className="border-b border-border/50 text-sm">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-foreground">{result.companyName}</p>
                      <p className="text-xs text-muted-foreground">{result.period}</p>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium text-foreground">
                    ${(result.cdrCalculatedRevenue / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    ${(result.reportedRevenue / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn(
                      'font-medium',
                      result.discrepancyPercentage > 10 ? 'text-destructive' : 
                      result.discrepancyPercentage > 5 ? 'text-chart-2' : 'text-muted-foreground'
                    )}>
                      {result.discrepancyPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-destructive">
                    ${(result.estimatedTaxLeakage / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 text-center">
                    <RiskBadge level={result.riskLevel} />
                  </td>
                  <td className="py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Export Report</DropdownMenuItem>
                        <DropdownMenuItem>Flag for Review</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
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
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize',
      styles[level]
    )}>
      {level}
    </span>
  )
}
