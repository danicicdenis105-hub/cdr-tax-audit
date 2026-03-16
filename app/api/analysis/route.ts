import { NextRequest, NextResponse } from 'next/server'
import { runAnalysis } from '@/lib/analysis-engine'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || undefined
    const companyId = searchParams.get('companyId') || undefined
    const riskLevel = searchParams.get('riskLevel') || undefined
    const billingType = searchParams.get('billingType') || undefined

    let results = await runAnalysis(period, billingType)

    // Apply filters
    if (companyId && companyId !== 'all') {
      results = results.filter(r => r.companyId === companyId)
    }
    if (riskLevel && riskLevel !== 'all') {
      results = results.filter(r => r.riskLevel === riskLevel)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Analysis API error:', error)
    return NextResponse.json({ error: 'Failed to run analysis' }, { status: 500 })
  }
}
