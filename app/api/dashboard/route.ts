import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStats, runAnalysis, getMonthlyTrends, getServiceTypeBreakdown, getRiskDistribution } from '@/lib/analysis-engine'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const [stats, analysisResults, monthlyTrends, serviceBreakdown, riskDistribution] = await Promise.all([
      getDashboardStats(),
      runAnalysis(),
      getMonthlyTrends(12),
      getServiceTypeBreakdown(),
      getRiskDistribution(),
    ])

    return NextResponse.json({
      stats,
      analysisResults,
      monthlyTrends,
      serviceBreakdown,
      riskDistribution,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
