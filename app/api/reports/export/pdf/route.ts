import { NextRequest, NextResponse } from 'next/server'
import { runAnalysis } from '@/lib/analysis-engine'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || undefined
    const companyId = searchParams.get('companyId') || undefined

    let results = await runAnalysis(period)
    if (companyId && companyId !== 'all') {
      results = results.filter(r => r.companyId === companyId)
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
    const taxTTC = settings?.taxTTC ?? 26
    const tictechRate = settings?.tictechRate ?? 7

    const totalLeakage = results.reduce((sum, r) => sum + r.estimatedTaxLeakage, 0)
    const totalDiscrepancy = results.reduce((sum, r) => sum + r.discrepancy, 0)
    const criticalCount = results.filter(r => r.riskLevel === 'critical').length
    const highCount = results.filter(r => r.riskLevel === 'high').length

    // Generate PDF using jsPDF
    // We dynamically import to avoid SSR issues
    const { default: jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Header
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, 297, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text('CDR Tax Analyzer - Revenue Assurance Report', 15, 15)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 15, 23)
    doc.text(`Period: ${period || 'All Time'}  |  TVA: ${taxTTC}%  |  TICTECH: ${tictechRate}%`, 15, 29)

    // Confidentiality notice
    doc.setTextColor(239, 68, 68) // red-500
    doc.setFontSize(8)
    doc.text('CONFIDENTIAL - GOVERNMENT USE ONLY', 230, 29)

    // Summary cards
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text('Executive Summary', 15, 45)

    const summaryY = 50
    const cardWidth = 62
    const summaryItems = [
      { label: 'Companies Analyzed', value: results.length.toString() },
      { label: 'Total Revenue Discrepancy', value: `${(totalDiscrepancy / 1_000_000).toFixed(1)}M FCFA` },
      { label: 'Est. Tax Leakage (TVA+TICTECH)', value: `${(totalLeakage / 1_000_000).toFixed(1)}M FCFA` },
      { label: 'Critical/High Risk', value: `${criticalCount + highCount} companies` },
    ]

    summaryItems.forEach((item, i) => {
      const x = 15 + i * (cardWidth + 5)
      doc.setFillColor(241, 245, 249) // slate-100
      doc.roundedRect(x, summaryY, cardWidth, 20, 2, 2, 'F')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139) // slate-500
      doc.text(item.label, x + 4, summaryY + 7)
      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42) // slate-900
      doc.text(item.value, x + 4, summaryY + 16)
    })

    // Company Analysis Table
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text('Company-Level Analysis', 15, 82)

    const tableData = results.map(r => [
      r.companyName,
      `${(r.cdrCalculatedRevenue / 1_000_000).toFixed(1)}M FCFA`,
      `${(r.reportedRevenue / 1_000_000).toFixed(1)}M FCFA`,
      `${(r.discrepancy / 1_000_000).toFixed(1)}M FCFA`,
      `${r.discrepancyPercentage.toFixed(1)}%`,
      `${(r.estimatedTaxLeakage / 1_000_000).toFixed(1)}M FCFA`,
      r.riskLevel.toUpperCase(),
    ])

    autoTable(doc, {
      startY: 86,
      head: [['Company', 'CDR Revenue', 'Reported Revenue', 'Discrepancy', 'Disc. %', 'Est. Tax Leakage', 'Risk']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 55 },
        6: { cellWidth: 22 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 6) {
          const risk = data.row.raw?.[6]
          if (risk === 'CRITICAL') {
            data.cell.styles.textColor = [220, 38, 38]
            data.cell.styles.fontStyle = 'bold'
          } else if (risk === 'HIGH') {
            data.cell.styles.textColor = [234, 88, 12]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })

    // Service Breakdown Table per company
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 130

    if (finalY < 160) {
      doc.setFontSize(12)
      doc.text('Service Type Breakdown', 15, finalY + 10)

      const serviceData = results.map(r => [
        r.companyName,
        `${(r.callVolumeAnalysis.voice.revenue / 1_000_000).toFixed(1)}M FCFA`,
        `${(r.callVolumeAnalysis.sms.revenue / 1_000_000).toFixed(1)}M FCFA`,
        `${(r.callVolumeAnalysis.data.revenue / 1_000_000).toFixed(1)}M FCFA`,
        `${(r.callVolumeAnalysis.international.revenue / 1_000_000).toFixed(1)}M FCFA`,
      ])

      autoTable(doc, {
        startY: finalY + 14,
        head: [['Company', 'Voice Revenue', 'SMS Revenue', 'Data Revenue', 'International Revenue']],
        body: serviceData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
      })
    }

    // Methodology Page
    doc.addPage()
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 297, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text('Methodology & Data Sources', 15, 16)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    let mY = 35

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('1. Data Sources', 15, mY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    mY += 7

    // Get upload info for data provenance
    const uploads = await prisma.cDRUpload.findMany({
      where: { status: 'completed' },
      orderBy: { uploadedAt: 'desc' },
      take: 10,
      include: { company: { select: { name: true } } },
    })

    for (const u of uploads) {
      doc.text(`- ${u.company.name}: ${u.originalFileName || u.fileName} (${u.recordCount} records, hash: ${u.fileHash?.substring(0, 16) || 'N/A'}...)`, 20, mY)
      mY += 5
    }

    mY += 5
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('2. Tax Rates Applied', 15, mY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    mY += 7

    // Show current global rates
    doc.text(`- Global TVA Rate: ${taxTTC}%  |  TICTECH Rate: ${tictechRate}%`, 20, mY)
    mY += 5

    // Show historical periods if any
    const taxPeriods = await prisma.taxPeriod.findMany({ orderBy: { startDate: 'desc' } })
    for (const tp of taxPeriods) {
      const endStr = tp.endDate ? new Date(tp.endDate).toLocaleDateString() : 'Current'
      doc.text(`- ${tp.name}: TVA ${tp.tvaRate}%, TICTECH ${tp.tictechRate}% (${new Date(tp.startDate).toLocaleDateString()} - ${endStr})`, 20, mY)
      mY += 5
    }

    mY += 5
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('3. Revenue Calculation', 15, mY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    mY += 7
    doc.text('CDR-calculated revenue (Amount TTC) is derived from individual call records using:', 20, mY)
    mY += 5
    doc.text('- Explicit revenue columns (amount_ttc / montant_ttc) when present in CDR data', 20, mY)
    mY += 5
    doc.text('- Company-specific rate plans when configured, falling back to global service rates', 20, mY)
    mY += 5
    doc.text('- Amount HT = Amount TTC / (1 + TVA_Rate/100)', 20, mY)
    mY += 5
    doc.text('- TICTECH = Amount HT * (TICTECH_Rate/100)', 20, mY)

    mY += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('4. Discrepancy & Leakage Formula', 15, mY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    mY += 7
    doc.text('Discrepancy = max(0, CDR_Calculated_Revenue - Operator_Reported_Revenue)', 20, mY)
    mY += 5
    doc.text('TVA Leakage = Discrepancy - (Discrepancy / (1 + TVA_Rate/100))', 20, mY)
    mY += 5
    doc.text('TICTECH Leakage = (Discrepancy / (1 + TVA_Rate/100)) * (TICTECH_Rate/100)', 20, mY)
    mY += 5
    doc.text('Total Estimated Leakage = TVA Leakage + TICTECH Leakage', 20, mY)

    mY += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('5. Risk Classification', 15, mY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    mY += 7
    doc.text(`- Low: Discrepancy < ${settings?.discrepancyThreshold ?? 5}%`, 20, mY)
    mY += 5
    doc.text(`- Medium: ${settings?.discrepancyThreshold ?? 5}% <= Discrepancy < 15%`, 20, mY)
    mY += 5
    doc.text('- High: 15% <= Discrepancy < ' + (settings?.criticalThreshold ?? 20) + '%', 20, mY)
    mY += 5
    doc.text(`- Critical: Discrepancy >= ${settings?.criticalThreshold ?? 20}%`, 20, mY)

    mY += 10
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Report generated: ${new Date().toISOString()} | Generated by user: ${session.userId}`, 20, mY)

    // Footer on all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `CDR Tax Analyzer - Confidential Government Document  |  Page ${i} of ${pageCount}`,
        148, 200, { align: 'center' }
      )
    }

    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cdr-tax-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF report' }, { status: 500 })
  }
}
