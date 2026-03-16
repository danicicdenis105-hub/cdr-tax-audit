import type {
  TelecomCompany,
  AnalysisResult,
  DashboardStats,
  MonthlyTrend,
  RiskDistribution,
  ServiceTypeBreakdown,
} from './types'

// Empty defaults — no mock data. All data comes from the database.

export const telecomCompanies: TelecomCompany[] = []

export const analysisResults: AnalysisResult[] = []

export const dashboardStats: DashboardStats = {
  totalCompanies: 0,
  totalCDRRecords: 0,
  totalEstimatedLeakage: 0,
  highRiskCompanies: 0,
  complianceRate: 100,
  revenueDiscrepancy: 0,
}

export const monthlyTrends: MonthlyTrend[] = []

export const companyRiskDistribution: RiskDistribution[] = []

export const serviceTypeBreakdown: ServiceTypeBreakdown[] = []
