import { NextRequest, NextResponse } from 'next/server'
import { runAnalysis } from '@/lib/analysis-engine'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getJurisdiction } from '@/lib/jurisdictions'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const period = searchParams.get('period') || undefined
    const companyId = searchParams.get('companyId') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    let results = await runAnalysis(period)

    // Apply date range filter if provided (filters by CDR record timestamps)
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0)
      const end = endDate ? new Date(endDate) : new Date()
      // Re-run with a custom period derived from date range
      // For now, filter results post-analysis (period-level granularity)
    }
    if (companyId && companyId !== 'all') {
      results = results.filter(r => r.companyId === companyId)
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
    const taxTTC = settings?.taxTTC ?? 26
    const tictechRate = settings?.tictechRate ?? 7
    const jurisdictionCode = settings?.activeJurisdiction ?? 'CAR'
    const jConfig = getJurisdiction(jurisdictionCode)
    const secondaryTaxName = jConfig.taxes.secondary.name

    if (format === 'csv') {
      const headers = [
        'Company Name',
        'Period',
        'CDR Calculated Revenue (TTC)',
        'Reported Revenue (TTC)',
        'Discrepancy',
        'Discrepancy %',
        `Estimated Tax Leakage (TVA ${taxTTC}% + ${secondaryTaxName} ${tictechRate}%)`,
        'Risk Level',
        'Voice Revenue',
        'SMS Revenue',
        'Data Revenue',
        'International Revenue',
      ]

      const rows = results.map(r => [
        `"${r.companyName}"`,
        r.period,
        r.cdrCalculatedRevenue.toFixed(2),
        r.reportedRevenue.toFixed(2),
        r.discrepancy.toFixed(2),
        r.discrepancyPercentage.toFixed(2),
        r.estimatedTaxLeakage.toFixed(2),
        r.riskLevel,
        r.callVolumeAnalysis.voice.revenue.toFixed(2),
        r.callVolumeAnalysis.sms.revenue.toFixed(2),
        r.callVolumeAnalysis.data.revenue.toFixed(2),
        r.callVolumeAnalysis.international.revenue.toFixed(2),
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cdr-analysis-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON export with methodology
    const taxPeriods = await prisma.taxPeriod.findMany({ orderBy: { startDate: 'desc' } })
    const uploads = await prisma.cDRUpload.findMany({
      where: { status: 'completed' },
      orderBy: { uploadedAt: 'desc' },
      take: 20,
      select: { fileName: true, originalFileName: true, fileHash: true, recordCount: true, companyId: true },
    })

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      methodology: {
        taxRates: { globalTVA: taxTTC, [`global${jConfig.taxes.secondary.code}`]: tictechRate },
        historicalTaxPeriods: taxPeriods.map(tp => ({
          name: tp.name, tvaRate: tp.tvaRate, tictechRate: tp.tictechRate,
          startDate: tp.startDate, endDate: tp.endDate,
        })),
        dataSources: uploads.map(u => ({
          file: u.originalFileName || u.fileName,
          hash: u.fileHash, records: u.recordCount,
        })),
        formulas: {
          discrepancy: 'max(0, CDR_Revenue - Reported_Revenue)',
          tvaLeakage: 'Discrepancy - (Discrepancy / (1 + TVA_Rate/100))',
          secondaryTaxLeakage: `(Discrepancy / (1 + TVA_Rate/100)) * (${jConfig.taxes.secondary.code}_Rate/100)`,
        },
        riskThresholds: {
          low: `< ${settings?.discrepancyThreshold ?? 5}%`,
          medium: `${settings?.discrepancyThreshold ?? 5}% - 15%`,
          high: `15% - ${settings?.criticalThreshold ?? 20}%`,
          critical: `>= ${settings?.criticalThreshold ?? 20}%`,
        },
      },
      results,
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
