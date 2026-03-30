export interface DashboardStats {
  totalCompanies: number
  totalCDRRecords: number
  totalEstimatedLeakage: number
  highRiskCompanies: number
  complianceRate: number
  revenueDiscrepancy: number
}

export interface TelecomCompany {
  id: string
  name: string
  licenseNumber: string
  region: string
  status: 'active' | 'under-review' | 'suspended'
  contactEmail: string
  contactPhone: string
  taxId: string
  numberPrefixes: string
  createdAt: string
}

export interface CDRRecord {
  id: string
  companyId: string
  callType: string
  duration?: number
  billedDuration?: number
  dataUsageMB?: number
  timestamp: string
  originNumber: string
  destinationNumber: string
  calculatedRevenue: number
  amountHT?: number
  taxTictech?: number
  destinationOperator?: string
}

export interface ServiceAnalysis {
  count: number
  revenue: number
  reportedRevenue?: number
}

export interface CallVolumeAnalysis {
  voice: ServiceAnalysis
  sms: ServiceAnalysis
  data: ServiceAnalysis
  international: ServiceAnalysis
  recharge?: ServiceAnalysis
  subscription?: ServiceAnalysis
  roaming?: ServiceAnalysis
  mobileMoney?: ServiceAnalysis
}

export interface AnalysisResult {
  companyId: string
  companyName: string
  period: string
  cdrCalculatedRevenue: number
  reportedRevenue: number
  discrepancy: number
  discrepancyPercentage: number
  estimatedTaxLeakage: number
  estimatedTictechLeakage: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  callVolumeAnalysis: CallVolumeAnalysis
}

export interface MonthlyTrend {
  month: string
  reported: number
  calculated: number
  leakage: number
}

export interface RiskDistribution {
  name: string
  value: number
}

export interface ServiceTypeBreakdown {
  type: string
  cdrRevenue: number
  reportedRevenue: number
}

export interface CDRUpload {
  id: string
  companyId: string
  companyName: string
  fileName: string
  fileSize: number
  recordCount: number
  status: 'processing' | 'completed' | 'failed'
  uploadedAt: string
  processedAt?: string
  errorMessage?: string
}

export interface Report {
  id: string
  title: string
  type: 'monthly' | 'quarterly' | 'audit' | 'custom'
  period: string
  createdAt: string
  status: 'completed' | 'pending' | 'draft'
  fileSize: string
  companies: number
  estimatedLeakage: number
}

export interface ServiceBreakdownItem {
  count: number
  revenueTTC: number
}

export interface RevenueIntelligenceResult {
  companyId: string
  companyName: string
  period: string
  totalRevenueTTC: number
  totalRevenueHT: number
  estimatedTVA: number
  estimatedTICTECH: number
  totalEstimatedTax: number
  recordCount: number
  hasSalesReports: boolean
  serviceBreakdown: {
    voice: ServiceBreakdownItem
    sms: ServiceBreakdownItem
    data: ServiceBreakdownItem
    international: ServiceBreakdownItem
    recharge: ServiceBreakdownItem
    subscription: ServiceBreakdownItem
    roaming: ServiceBreakdownItem
    mobileMoney: ServiceBreakdownItem
  }
}

export interface Settings {
  taxTTC: number
  tictechRate: number
  discrepancyThreshold: number
  criticalThreshold: number
  voiceRate: number
  smsRate: number
  dataRate: number
  ussdRate: number
  mttRate: number
  emailAlerts: boolean
  weeklyReports: boolean
  uploadNotifications: boolean
  reportFormat: string
  dateFormat: string
  currency: string
}
