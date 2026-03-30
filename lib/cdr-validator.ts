/**
 * CDR record validation layer.
 * Validates individual CDR rows before insertion to ensure data quality.
 */

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

const KNOWN_CALL_TYPES = new Set([
  'voice', 'voice-onnet', 'voice-offnet', 'sms', 'sms-national', 'sms-intl',
  'data', 'international', 'incoming-intl', 'voice-intl-outgoing',
  'recharge', 'subscription', 'roaming-voice', 'roaming-sms',
  'ussd', 'mobile-money',
])

/**
 * Validate a single CDR row.
 */
export function validateCDRRow(params: {
  timestamp: Date
  origin: string
  destination: string
  callType: string
  duration: number | null
  billedDuration: number | null
  revenueTTC: number
  dataMB: number | null
  rowIndex: number
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Timestamp validation
  if (isNaN(params.timestamp.getTime())) {
    errors.push(`Row ${params.rowIndex}: Invalid timestamp`)
  } else {
    const now = new Date()
    now.setDate(now.getDate() + 1) // Allow 1 day buffer for timezone differences
    if (params.timestamp > now) {
      warnings.push(`Row ${params.rowIndex}: Timestamp is in the future`)
    }
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    if (params.timestamp < fiveYearsAgo) {
      warnings.push(`Row ${params.rowIndex}: Timestamp is more than 5 years old`)
    }
  }

  // Phone number validation (basic)
  if (params.origin && !/^\+?[\d\s()-]{4,20}$/.test(params.origin)) {
    warnings.push(`Row ${params.rowIndex}: Origin number has unusual format: ${params.origin.substring(0, 15)}`)
  }
  if (params.destination && !/^\+?[\d\s()-]{4,20}$/.test(params.destination)) {
    // Allow empty destination for data/recharge/subscription/ussd/mobile-money
    if (!['data', 'recharge', 'subscription', 'ussd', 'mobile-money'].includes(params.callType)) {
      warnings.push(`Row ${params.rowIndex}: Destination number has unusual format`)
    }
  }

  // Duration validation
  if (params.duration !== null && params.duration < 0) {
    errors.push(`Row ${params.rowIndex}: Negative duration: ${params.duration}`)
  }
  if (params.billedDuration !== null && params.billedDuration < 0) {
    errors.push(`Row ${params.rowIndex}: Negative billed duration: ${params.billedDuration}`)
  }
  if (params.duration !== null && params.duration > 86400) {
    warnings.push(`Row ${params.rowIndex}: Duration exceeds 24 hours`)
  }

  // Revenue validation
  if (params.revenueTTC < 0) {
    errors.push(`Row ${params.rowIndex}: Negative revenue: ${params.revenueTTC}`)
  }
  if (params.revenueTTC > 10_000_000) {
    warnings.push(`Row ${params.rowIndex}: Unusually high revenue: ${params.revenueTTC} XAF`)
  }

  // Data usage validation
  if (params.dataMB !== null && params.dataMB < 0) {
    errors.push(`Row ${params.rowIndex}: Negative data usage: ${params.dataMB}`)
  }

  // Call type validation
  if (!KNOWN_CALL_TYPES.has(params.callType)) {
    warnings.push(`Row ${params.rowIndex}: Unknown call type "${params.callType}", defaulting to voice`)
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Generate a summary of validation results.
 */
export function summarizeValidation(results: { accepted: number; rejected: number; warnings: number; errors: string[]; warningMessages: string[] }) {
  const maxErrors = 50 // Limit stored error details
  return {
    accepted: results.accepted,
    rejected: results.rejected,
    warnings: results.warnings,
    sampleErrors: results.errors.slice(0, maxErrors),
    sampleWarnings: results.warningMessages.slice(0, maxErrors),
    totalErrors: results.errors.length,
    totalWarnings: results.warningMessages.length,
  }
}
