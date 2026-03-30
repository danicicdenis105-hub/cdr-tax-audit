import { prisma } from './db'
import type { AnalysisResult, MonthlyTrend, ServiceTypeBreakdown, DashboardStats, RevenueIntelligenceResult } from './types'
import { getJurisdiction } from './jurisdictions'

export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'global' } })
  }
  return settings
}

/** Get the active jurisdiction code from settings */
export async function getActiveJurisdiction(): Promise<string> {
  const settings = await getSettings()
  return settings.activeJurisdiction
}

/** Get tax rates for the active jurisdiction (settings override or jurisdiction defaults) */
export async function getJurisdictionTaxRates() {
  const settings = await getSettings()
  const j = getJurisdiction(settings.activeJurisdiction)
  return {
    jurisdiction: j,
    primaryRate: settings.taxTTC,
    secondaryRate: settings.tictechRate,
  }
}

/**
 * CAR dual-tax leakage calculation:
 * From a TTC discrepancy, the government loses:
 * - TVA portion: discrepancy - (discrepancy / (1 + taxTTC/100))
 * - TICTECH: (discrepancy / (1 + taxTTC/100)) * (tictechRate/100)
 */
function calculateTaxLeakage(discrepancy: number, taxTTC: number, tictechRate: number) {
  if (discrepancy <= 0) return { tvaLeakage: 0, tictechLeakage: 0, totalLeakage: 0 }
  const divisor = 1 + taxTTC / 100
  const amountHT = discrepancy / divisor
  const tvaLeakage = discrepancy - amountHT
  const tictechLeakage = amountHT * (tictechRate / 100)
  return { tvaLeakage, tictechLeakage, totalLeakage: tvaLeakage + tictechLeakage }
}

/**
 * Resolve destination operator from phone number using prefix matching.
 * Returns operator name or null if no match.
 */
export async function resolveOperator(phoneNumber: string, jurisdiction?: string): Promise<string | null> {
  const where: Record<string, unknown> = {}
  if (jurisdiction) where.jurisdiction = jurisdiction
  const operators = await prisma.telecomCompany.findMany({
    select: { name: true, numberPrefixes: true },
    where,
  })

  // Strip leading + or 00
  let cleaned = phoneNumber.replace(/^\+/, '').replace(/^00/, '')

  // Build prefix-to-operator map, sorted by longest prefix first
  const prefixMap: { prefix: string; name: string }[] = []
  for (const op of operators) {
    if (!op.numberPrefixes) continue
    for (const prefix of op.numberPrefixes.split(',')) {
      const p = prefix.trim()
      if (p) prefixMap.push({ prefix: p, name: op.name })
    }
  }
  prefixMap.sort((a, b) => b.prefix.length - a.prefix.length)

  for (const { prefix, name } of prefixMap) {
    if (cleaned.startsWith(prefix)) return name
  }
  return null
}

// Map call types to broad categories for analysis grouping
function categorizeCallType(callType: string): string {
  const t = callType.toLowerCase()
  if (t === 'mobile-money' || t === 'ussd') return 'mobileMoney'
  if (t === 'recharge') return 'recharge'
  if (t === 'subscription') return 'subscription'
  if (t.includes('roaming')) return 'roaming'
  if (t.includes('sms')) return 'sms'
  if (t.includes('intl') || t.includes('international') || t === 'incoming-intl' || t === 'voice-intl-outgoing') return 'international'
  if (t.includes('voice') || t.includes('call') || t === 'voice-onnet' || t === 'voice-offnet') return 'voice'
  if (t.includes('data') || t.includes('internet')) return 'data'
  return 'voice' // default
}

export async function runAnalysis(period?: string, billingType?: string): Promise<AnalysisResult[]> {
  const settings = await getSettings()
  const jurisdiction = settings.activeJurisdiction
  const taxPeriods = await prisma.taxPeriod.findMany({ where: { jurisdiction }, orderBy: { startDate: 'desc' } })
  const companies = await prisma.telecomCompany.findMany({
    where: { status: { not: 'suspended' }, jurisdiction },
  })

  const results: AnalysisResult[] = []

  for (const company of companies) {
    const whereClause: Record<string, unknown> = { companyId: company.id }
    if (period && period !== 'all') {
      const { start, end } = parsePeriod(period)
      whereClause.timestamp = { gte: start, lte: end }
    }
    if (billingType && billingType !== 'all') {
      whereClause.billingType = billingType
    }

    const cdrRecords = await prisma.cDRRecord.findMany({ where: whereClause })

    if (cdrRecords.length === 0) continue

    // Calculate CDR revenue by broad category
    const voiceRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'voice')
    const smsRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'sms')
    const dataRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'data')
    const intlRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'international')
    const rechargeRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'recharge')
    const subscriptionRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'subscription')
    const roamingRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'roaming')
    const mobileMoneyRecords = cdrRecords.filter(r => categorizeCallType(r.callType) === 'mobileMoney')

    const voiceRevenue = voiceRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const smsRevenue = smsRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const dataRevenue = dataRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const intlRevenue = intlRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const rechargeRevenue = rechargeRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const subscriptionRevenue = subscriptionRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const roamingRevenue = roamingRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const mobileMoneyRevenue = mobileMoneyRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)

    const totalCDRRevenue = voiceRevenue + smsRevenue + dataRevenue + intlRevenue + rechargeRevenue + subscriptionRevenue + roamingRevenue + mobileMoneyRevenue

    // Get reported revenue for the same period
    const salesWhere: Record<string, unknown> = { companyId: company.id }
    if (period && period !== 'all') {
      salesWhere.period = period
    }
    const salesReports = await prisma.salesReport.findMany({ where: salesWhere })
    const totalReported = salesReports.reduce((sum, r) => sum + r.reportedRevenue, 0)

    // Calculate discrepancy
    const discrepancy = Math.max(0, totalCDRRevenue - totalReported)
    const discrepancyPercentage = totalCDRRevenue > 0
      ? Math.max(0, (discrepancy / totalCDRRevenue) * 100)
      : 0

    // CAR dual-tax leakage calculation
    const { totalLeakage, tictechLeakage } = calculateTaxLeakage(
      discrepancy, settings.taxTTC, settings.tictechRate
    )

    // Determine risk level based on thresholds
    let riskLevel: AnalysisResult['riskLevel'] = 'low'
    if (discrepancyPercentage >= settings.criticalThreshold) riskLevel = 'critical'
    else if (discrepancyPercentage >= 15) riskLevel = 'high'
    else if (discrepancyPercentage >= settings.discrepancyThreshold) riskLevel = 'medium'

    const periodLabel = period || 'All Time'

    results.push({
      companyId: company.id,
      companyName: company.name,
      period: periodLabel,
      cdrCalculatedRevenue: totalCDRRevenue,
      reportedRevenue: totalReported,
      discrepancy,
      discrepancyPercentage,
      estimatedTaxLeakage: totalLeakage,
      estimatedTictechLeakage: tictechLeakage,
      riskLevel,
      callVolumeAnalysis: {
        voice: { count: voiceRecords.length, revenue: voiceRevenue },
        sms: { count: smsRecords.length, revenue: smsRevenue },
        data: { count: dataRecords.length, revenue: dataRevenue },
        international: { count: intlRecords.length, revenue: intlRevenue },
        recharge: { count: rechargeRecords.length, revenue: rechargeRevenue },
        subscription: { count: subscriptionRecords.length, revenue: subscriptionRevenue },
        roaming: { count: roamingRecords.length, revenue: roamingRevenue },
        mobileMoney: { count: mobileMoneyRecords.length, revenue: mobileMoneyRevenue },
      },
    })
  }

  return results.sort((a, b) => b.discrepancyPercentage - a.discrepancyPercentage)
}

export async function getMonthlyTrends(months = 12): Promise<MonthlyTrend[]> {
  const trends: MonthlyTrend[] = []
  const now = new Date()
  const settings = await getSettings()
  const jurisdiction = settings.activeJurisdiction

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const cdrRecords = await prisma.cDRRecord.findMany({
      where: {
        timestamp: { gte: date, lte: endOfMonth },
        jurisdiction,
      },
    })

    const calculated = cdrRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)

    const salesReports = await prisma.salesReport.findMany({
      where: { period, company: { jurisdiction } },
    })
    const reported = salesReports.reduce((sum, r) => sum + r.reportedRevenue, 0)

    const discrepancy = Math.max(0, calculated - reported)
    const { totalLeakage } = calculateTaxLeakage(discrepancy, settings.taxTTC, settings.tictechRate)

    trends.push({ month: monthLabel, reported, calculated, leakage: totalLeakage })
  }

  return trends
}

export async function getServiceTypeBreakdown(): Promise<ServiceTypeBreakdown[]> {
  const settings = await getSettings()
  const jurisdiction = settings.activeJurisdiction
  const typeConfig = [
    { label: 'Voice', callTypes: ['voice', 'voice-onnet', 'voice-offnet'], salesField: 'voiceRevenue' },
    { label: 'SMS', callTypes: ['sms', 'sms-national', 'sms-intl'], salesField: 'smsRevenue' },
    { label: 'Data', callTypes: ['data'], salesField: 'dataRevenue' },
    { label: 'International', callTypes: ['international', 'incoming-intl', 'voice-intl-outgoing'], salesField: 'intlRevenue' },
    { label: 'Recharge', callTypes: ['recharge'], salesField: 'rechargeRevenue' },
    { label: 'Subscriptions', callTypes: ['subscription'], salesField: 'subscriptionRevenue' },
    { label: 'Roaming', callTypes: ['roaming-voice', 'roaming-sms'], salesField: 'roamingRevenue' },
    { label: 'Mobile Money / USSD', callTypes: ['ussd', 'mobile-money'], salesField: 'mobileMoneyRevenue' },
  ]

  const result: ServiceTypeBreakdown[] = []

  for (const config of typeConfig) {
    const cdrRecords = await prisma.cDRRecord.findMany({
      where: { callType: { in: config.callTypes }, jurisdiction },
    })
    const cdrRevenue = cdrRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)

    const salesReports = await prisma.salesReport.findMany({ where: { company: { jurisdiction } } })
    const reportedRevenue = salesReports.reduce((sum, r) => {
      const val = r[config.salesField as keyof typeof r]
      return sum + (typeof val === 'number' ? val : 0)
    }, 0)

    if (cdrRevenue > 0 || reportedRevenue > 0) {
      result.push({ type: config.label, cdrRevenue, reportedRevenue })
    }
  }

  return result
}

export async function getRiskDistribution() {
  const results = await runAnalysis()
  const distribution = [
    { name: 'Low Risk', value: results.filter(r => r.riskLevel === 'low').length },
    { name: 'Medium Risk', value: results.filter(r => r.riskLevel === 'medium').length },
    { name: 'High Risk', value: results.filter(r => r.riskLevel === 'high').length },
    { name: 'Critical', value: results.filter(r => r.riskLevel === 'critical').length },
  ]
  return distribution
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const settings = await getSettings()
  const jurisdiction = settings.activeJurisdiction
  const companies = await prisma.telecomCompany.count({ where: { jurisdiction } })
  const cdrCount = await prisma.cDRRecord.count({ where: { jurisdiction } })
  const results = await runAnalysis()

  const totalLeakage = results.reduce((sum, r) => sum + r.estimatedTaxLeakage, 0)
  const highRisk = results.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length
  const compliant = results.filter(r => r.discrepancyPercentage < 5).length
  const complianceRate = results.length > 0 ? Math.round((compliant / results.length) * 100) : 100
  const revenueDiscrepancy = results.reduce((sum, r) => sum + r.discrepancy, 0)

  return {
    totalCompanies: companies,
    totalCDRRecords: cdrCount,
    totalEstimatedLeakage: totalLeakage,
    highRiskCompanies: highRisk,
    complianceRate,
    revenueDiscrepancy,
  }
}

export async function runRevenueIntelligence(
  period?: string,
  billingType?: string,
  companyId?: string
): Promise<RevenueIntelligenceResult[]> {
  const settings = await getSettings()
  const jurisdiction = settings.activeJurisdiction
  const companiesWhere: Record<string, unknown> = { status: { not: 'suspended' }, jurisdiction }
  if (companyId) companiesWhere.id = companyId

  const companies = await prisma.telecomCompany.findMany({ where: companiesWhere })
  const results: RevenueIntelligenceResult[] = []

  for (const company of companies) {
    const whereClause: Record<string, unknown> = { companyId: company.id }
    if (period && period !== 'all') {
      const { start, end } = parsePeriod(period)
      whereClause.timestamp = { gte: start, lte: end }
    }
    if (billingType && billingType !== 'all') {
      whereClause.billingType = billingType
    }

    const cdrRecords = await prisma.cDRRecord.findMany({ where: whereClause })
    if (cdrRecords.length === 0) continue

    const serviceTypes = ['voice', 'sms', 'data', 'international', 'recharge', 'subscription', 'roaming', 'mobileMoney'] as const
    const breakdown: Record<string, { count: number; revenueTTC: number }> = {}
    for (const st of serviceTypes) {
      breakdown[st] = { count: 0, revenueTTC: 0 }
    }

    for (const record of cdrRecords) {
      const cat = categorizeCallType(record.callType)
      if (breakdown[cat]) {
        breakdown[cat].count++
        breakdown[cat].revenueTTC += record.calculatedRevenue
      }
    }

    const totalRevenueTTC = cdrRecords.reduce((sum, r) => sum + r.calculatedRevenue, 0)
    const divisor = 1 + settings.taxTTC / 100
    const totalRevenueHT = totalRevenueTTC / divisor
    const estimatedTVA = totalRevenueTTC - totalRevenueHT
    const estimatedTICTECH = totalRevenueHT * (settings.tictechRate / 100)

    const salesCount = await prisma.salesReport.count({ where: { companyId: company.id } })

    results.push({
      companyId: company.id,
      companyName: company.name,
      period: period || 'All Time',
      totalRevenueTTC,
      totalRevenueHT,
      estimatedTVA,
      estimatedTICTECH,
      totalEstimatedTax: estimatedTVA + estimatedTICTECH,
      recordCount: cdrRecords.length,
      hasSalesReports: salesCount > 0,
      serviceBreakdown: breakdown as RevenueIntelligenceResult['serviceBreakdown'],
    })
  }

  return results.sort((a, b) => b.totalRevenueTTC - a.totalRevenueTTC)
}

function parsePeriod(period: string): { start: Date; end: Date } {
  if (period.includes('-q') || period.includes('-Q')) {
    const [yearStr, quarterStr] = period.split('-')
    const year = parseInt(yearStr)
    const quarter = parseInt(quarterStr.replace(/[qQ]/, ''))
    const startMonth = (quarter - 1) * 3
    return {
      start: new Date(year, startMonth, 1),
      end: new Date(year, startMonth + 3, 0, 23, 59, 59),
    }
  }
  if (period.length === 4) {
    const year = parseInt(period)
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31, 23, 59, 59),
    }
  }
  const [yearStr, monthStr] = period.split('-')
  const year = parseInt(yearStr)
  const month = parseInt(monthStr) - 1
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59),
  }
}
