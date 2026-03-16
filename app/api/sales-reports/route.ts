import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireMutatingAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where = companyId ? { companyId } : {}
    const [reports, total] = await Promise.all([
      prisma.salesReport.findMany({
        where,
        include: { company: { select: { name: true } } },
        orderBy: [{ period: 'desc' }, { companyId: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.salesReport.count({ where }),
    ])

    return NextResponse.json({ reports, total, page, limit })
  } catch (error) {
    console.error('SalesReport GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin', 'analyst'])
  if (session instanceof NextResponse) return session

  try {
    const contentType = request.headers.get('content-type') || ''

    // Support both JSON and form data (CSV upload)
    if (contentType.includes('multipart/form-data')) {
      return handleCSVUpload(request, session)
    }

    // JSON single entry
    const body = await request.json()
    const { companyId, period, reportedRevenue, voiceRevenue, smsRevenue, dataRevenue, intlRevenue, rechargeRevenue, subscriptionRevenue, roamingRevenue } = body

    if (!companyId || !period || reportedRevenue == null) {
      return NextResponse.json({ error: 'Company, period, and reported revenue are required' }, { status: 400 })
    }

    const report = await prisma.salesReport.upsert({
      where: { companyId_period: { companyId, period } },
      create: {
        companyId, period,
        reportedRevenue: parseFloat(reportedRevenue) || 0,
        voiceRevenue: parseFloat(voiceRevenue) || 0,
        smsRevenue: parseFloat(smsRevenue) || 0,
        dataRevenue: parseFloat(dataRevenue) || 0,
        intlRevenue: parseFloat(intlRevenue) || 0,
        rechargeRevenue: parseFloat(rechargeRevenue) || 0,
        subscriptionRevenue: parseFloat(subscriptionRevenue) || 0,
        roamingRevenue: parseFloat(roamingRevenue) || 0,
      },
      update: {
        reportedRevenue: parseFloat(reportedRevenue) || 0,
        voiceRevenue: parseFloat(voiceRevenue) || 0,
        smsRevenue: parseFloat(smsRevenue) || 0,
        dataRevenue: parseFloat(dataRevenue) || 0,
        intlRevenue: parseFloat(intlRevenue) || 0,
        rechargeRevenue: parseFloat(rechargeRevenue) || 0,
        subscriptionRevenue: parseFloat(subscriptionRevenue) || 0,
        roamingRevenue: parseFloat(roamingRevenue) || 0,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPSERT',
        entity: 'SalesReport',
        entityId: report.id,
        details: `Sales report for ${companyId} period ${period}: ${reportedRevenue} XAF`,
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('SalesReport POST error:', error)
    return NextResponse.json({ error: 'Failed to save sales report' }, { status: 500 })
  }
}

async function handleCSVUpload(request: NextRequest, session: { userId: string }) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'File required' }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.split('\n').filter(l => l.trim())

  if (lines.length < 2) {
    return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 })
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim())

  // Find column indices
  const companyIdx = header.findIndex(h => h.includes('company') || h.includes('operator') || h.includes('societe'))
  const periodIdx = header.findIndex(h => h.includes('period') || h.includes('periode') || h.includes('mois'))
  const revenueIdx = header.findIndex(h => h.includes('total') || h.includes('revenue') || h.includes('chiffre') || h.includes('reported'))
  const voiceIdx = header.findIndex(h => h.includes('voice') || h.includes('voix'))
  const smsIdx = header.findIndex(h => h.includes('sms'))
  const dataIdx = header.findIndex(h => h.includes('data') || h.includes('donnee'))
  const intlIdx = header.findIndex(h => h.includes('intl') || h.includes('international'))
  const rechargeIdx = header.findIndex(h => h.includes('recharge'))
  const subscriptionIdx = header.findIndex(h => h.includes('subscription') || h.includes('abonnement'))
  const roamingIdx = header.findIndex(h => h.includes('roaming'))

  if (companyIdx < 0 || periodIdx < 0 || revenueIdx < 0) {
    return NextResponse.json({ error: 'CSV must have company, period, and revenue/total columns' }, { status: 400 })
  }

  // Load companies for name-to-ID lookup
  const companies = await prisma.telecomCompany.findMany()
  const companyMap = new Map<string, string>()
  for (const c of companies) {
    companyMap.set(c.name.toLowerCase(), c.id)
    companyMap.set(c.id, c.id)
  }

  let processed = 0
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
    const companyRef = cols[companyIdx]?.trim()
    const period = cols[periodIdx]?.trim()
    const revenue = parseFloat(cols[revenueIdx]) || 0

    const companyId = companyMap.get(companyRef.toLowerCase()) || companyMap.get(companyRef)
    if (!companyId || !period) {
      skipped++
      continue
    }

    await prisma.salesReport.upsert({
      where: { companyId_period: { companyId, period } },
      create: {
        companyId, period,
        reportedRevenue: revenue,
        voiceRevenue: voiceIdx >= 0 ? parseFloat(cols[voiceIdx]) || 0 : 0,
        smsRevenue: smsIdx >= 0 ? parseFloat(cols[smsIdx]) || 0 : 0,
        dataRevenue: dataIdx >= 0 ? parseFloat(cols[dataIdx]) || 0 : 0,
        intlRevenue: intlIdx >= 0 ? parseFloat(cols[intlIdx]) || 0 : 0,
        rechargeRevenue: rechargeIdx >= 0 ? parseFloat(cols[rechargeIdx]) || 0 : 0,
        subscriptionRevenue: subscriptionIdx >= 0 ? parseFloat(cols[subscriptionIdx]) || 0 : 0,
        roamingRevenue: roamingIdx >= 0 ? parseFloat(cols[roamingIdx]) || 0 : 0,
      },
      update: {
        reportedRevenue: revenue,
        voiceRevenue: voiceIdx >= 0 ? parseFloat(cols[voiceIdx]) || 0 : 0,
        smsRevenue: smsIdx >= 0 ? parseFloat(cols[smsIdx]) || 0 : 0,
        dataRevenue: dataIdx >= 0 ? parseFloat(cols[dataIdx]) || 0 : 0,
        intlRevenue: intlIdx >= 0 ? parseFloat(cols[intlIdx]) || 0 : 0,
        rechargeRevenue: rechargeIdx >= 0 ? parseFloat(cols[rechargeIdx]) || 0 : 0,
        subscriptionRevenue: subscriptionIdx >= 0 ? parseFloat(cols[subscriptionIdx]) || 0 : 0,
        roamingRevenue: roamingIdx >= 0 ? parseFloat(cols[roamingIdx]) || 0 : 0,
      },
    })
    processed++
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'UPLOAD',
      entity: 'SalesReport',
      details: `Imported ${processed} sales reports from ${file.name} (skipped ${skipped})`,
    },
  })

  return NextResponse.json({ processed, skipped }, { status: 201 })
}
