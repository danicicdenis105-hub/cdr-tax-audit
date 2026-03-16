import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runRevenueIntelligence } from '@/lib/analysis-engine'

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = request.nextUrl
  const companyId = searchParams.get('companyId') || undefined
  const period = searchParams.get('period') || undefined
  const billingType = searchParams.get('billingType') || undefined

  const results = await runRevenueIntelligence(period, billingType, companyId)
  return NextResponse.json(results)
}
