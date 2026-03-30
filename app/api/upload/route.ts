import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveOperator, getSettings, getActiveJurisdiction } from '@/lib/analysis-engine'
import { requireAuth, verifySession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { validateCDRRow, summarizeValidation } from '@/lib/cdr-validator'
import { createHash } from 'crypto'

export const maxDuration = 300 // Allow up to 5 minutes for large file processing

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const jurisdiction = await getActiveJurisdiction()
    const uploads = await prisma.cDRUpload.findMany({
      where: { jurisdiction },
      include: { company: { select: { name: true } } },
      orderBy: { uploadedAt: 'desc' },
      take: 20,
    })

    const stats = {
      totalUploads: await prisma.cDRUpload.count({ where: { jurisdiction } }),
      totalRecords: await prisma.cDRRecord.count({ where: { jurisdiction } }),
      completedUploads: await prisma.cDRUpload.count({ where: { status: 'completed', jurisdiction } }),
      failedUploads: await prisma.cDRUpload.count({ where: { status: 'failed', jurisdiction } }),
    }

    return NextResponse.json({ uploads, stats })
  } catch (error) {
    console.error('Upload GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Auth check (admin + analyst can upload)
  const session = verifySession(request)
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!['admin', 'analyst'].includes(session.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Rate limit: 10 uploads per minute per user
  const limit = checkRateLimit(`upload:${session.userId}`, 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Upload rate limit exceeded' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string | null

    if (!file || !companyId) {
      return NextResponse.json({ error: 'File and company ID required' }, { status: 400 })
    }

    const company = await prisma.telecomCompany.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Read file and compute SHA-256 hash for chain of custody
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = Buffer.from(fileBuffer)
    const fileHash = createHash('sha256').update(fileBytes).digest('hex')

    // Get active jurisdiction
    const jurisdiction = await getActiveJurisdiction()

    // Create upload record with integrity metadata
    const upload = await prisma.cDRUpload.create({
      data: {
        companyId,
        fileName: file.name,
        originalFileName: file.name,
        fileSize: file.size,
        fileHash,
        uploadedById: session.userId,
        jurisdiction,
        status: 'processing',
      },
    })

    const text = fileBytes.toString('utf-8')
    const lines = text.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      await prisma.cDRUpload.update({
        where: { id: upload.id },
        data: { status: 'failed', errorMessage: 'File is empty or has no data rows' },
      })
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Parse header — support English and French column names
    const header = lines[0].toLowerCase().split(',').map(h => h.trim())

    const callTypeIdx = header.findIndex(h =>
      h.includes('type') || h.includes('service') || h.includes('type_service')
    )
    const durationIdx = header.findIndex(h =>
      h.includes('duration') || h.includes('duree') || h.includes('durée')
    )
    const billedDurationIdx = header.findIndex(h =>
      h.includes('billed_duration') || h.includes('duree_facturee') || h.includes('durée_facturée') || h.includes('billed duration')
    )
    const dataIdx = header.findIndex(h =>
      h.includes('data') && (h.includes('mb') || h.includes('usage') || h.includes('volume'))
    )
    const timestampIdx = header.findIndex(h =>
      h.includes('time') || h.includes('date') || h.includes('horodatage')
    )
    const originIdx = header.findIndex(h =>
      h.includes('origin') || h.includes('caller') || h.includes('from') || h.includes('appelant') || h.includes('a_number')
    )
    const destIdx = header.findIndex(h =>
      h.includes('dest') || h.includes('called') || h.includes('to') || h.includes('appele') || h.includes('appelé') || h.includes('b_number')
    )
    const revenueIdx = header.findIndex(h =>
      h.includes('revenue') || h.includes('amount') || h.includes('charge') || h.includes('montant')
    )
    const amountTTCIdx = header.findIndex(h =>
      h.includes('amount_ttc') || h.includes('montant_ttc') || h.includes('ttc')
    )
    const amountHTIdx = header.findIndex(h =>
      h.includes('amount_ht') || h.includes('montant_ht')
    )
    const subscriberIdx = header.findIndex(h =>
      h.includes('subscriber') || h.includes('abonne') || h.includes('abonné') || h.includes('msisdn')
    )
    const ussdCodeIdx = header.findIndex(h =>
      h.includes('ussd_code') || h.includes('ussd') || h.includes('short_code') || h.includes('service_code')
    )
    const billingTypeIdx = header.findIndex(h =>
      h.includes('billing_type') || h.includes('type_facturation') || h.includes('billing') || h.includes('prepaid') || h.includes('postpaid')
    )

    const settings = await getSettings()
    const voiceRate = settings.voiceRate
    const smsRate = settings.smsRate
    const dataRate = settings.dataRate
    const taxDivisor = 1 + settings.taxTTC / 100

    // Load company-specific rate plans (active ones)
    const ratePlans = await prisma.ratePlan.findMany({
      where: { companyId },
      orderBy: { startDate: 'desc' },
    })

    // Load historical tax periods
    const taxPeriods = await prisma.taxPeriod.findMany({
      orderBy: { startDate: 'desc' },
    })

    // Load existing record hashes for this company for duplicate detection
    const existingHashes = new Set<string>()
    const existingRecords = await prisma.cDRRecord.findMany({
      where: { companyId, recordHash: { not: null } },
      select: { recordHash: true },
    })
    for (const r of existingRecords) {
      if (r.recordHash) existingHashes.add(r.recordHash)
    }

    // Track new hashes in this upload to detect intra-file duplicates
    const newHashes = new Set<string>()

    let acceptedCount = 0
    let rejectedCount = 0
    let warningCount = 0
    let duplicateCount = 0
    const validationErrors: string[] = []
    const validationWarnings: string[] = []
    const batchSize = 100
    let batch: Array<{
      companyId: string
      callType: string
      duration: number | null
      billedDuration: number | null
      dataUsageMB: number | null
      timestamp: Date
      originNumber: string
      destinationNumber: string
      calculatedRevenue: number
      amountHT: number | null
      taxTictech: number | null
      taxMTT: number | null
      destinationOperator: string | null
      recordHash: string
      billingType: string | null
      uploadId: string
      jurisdiction: string
    }> = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
      if (cols.length < 3) continue

      // Normalize call type
      const rawType = callTypeIdx >= 0 ? cols[callTypeIdx]?.toLowerCase() : 'voice'
      const normalizedType = normalizeCallType(rawType)

      const duration = durationIdx >= 0 ? parseInt(cols[durationIdx]) || null : null
      const billedDuration = billedDurationIdx >= 0 ? parseInt(cols[billedDurationIdx]) || null : null
      const dataMB = dataIdx >= 0 ? parseFloat(cols[dataIdx]) || null : null
      const timestamp = timestampIdx >= 0 ? new Date(cols[timestampIdx]) : new Date()
      const origin = originIdx >= 0 ? cols[originIdx] : ''
      const dest = destIdx >= 0 ? cols[destIdx] : ''

      // Detect billing type
      let billingType: string | null = null
      if (billingTypeIdx >= 0 && cols[billingTypeIdx]) {
        const bt = cols[billingTypeIdx].toLowerCase().trim()
        if (bt.includes('pre') || bt === '1') billingType = 'prepaid'
        else if (bt.includes('post') || bt === '2') billingType = 'postpaid'
      }

      // Revenue: prefer Amount TTC column, then revenue/amount column, then calculate
      let revenueTTC: number
      if (amountTTCIdx >= 0 && cols[amountTTCIdx]) {
        revenueTTC = parseFloat(cols[amountTTCIdx]) || 0
      } else if (revenueIdx >= 0 && cols[revenueIdx]) {
        revenueTTC = parseFloat(cols[revenueIdx]) || 0
      } else {
        // Try company-specific rate plan first, then fall back to global rates
        const companyRate = getRateForService(ratePlans, normalizedType, timestamp)
        const effectiveVoiceRate = companyRate?.serviceType === 'voice' ? companyRate.rate : voiceRate
        const effectiveSmsRate = companyRate?.serviceType === 'sms' ? companyRate.rate : smsRate
        const effectiveDataRate = companyRate?.serviceType === 'data' ? companyRate.rate : dataRate

        const effectiveDuration = billedDuration || duration || 60
        switch (normalizedType) {
          case 'voice-onnet':
          case 'voice-offnet':
          case 'voice':
            revenueTTC = (effectiveDuration / 60) * effectiveVoiceRate
            break
          case 'sms-national':
          case 'sms-intl':
          case 'sms':
            revenueTTC = effectiveSmsRate
            break
          case 'data':
            revenueTTC = (dataMB || 1) * effectiveDataRate
            break
          case 'incoming-intl':
          case 'voice-intl-outgoing':
          case 'international':
            revenueTTC = (effectiveDuration / 60) * effectiveVoiceRate * 3
            break
          case 'ussd':
          case 'mobile-money':
            // USSD/Mobile money: use amount if provided, else use ussd session rate
            revenueTTC = settings.ussdRate || 50
            break
          case 'recharge':
          case 'subscription':
            revenueTTC = parseFloat(cols[revenueIdx >= 0 ? revenueIdx : 0]) || 0
            break
          case 'roaming-voice':
          case 'roaming-sms':
            revenueTTC = (effectiveDuration / 60) * effectiveVoiceRate * 2
            break
          default:
            revenueTTC = 0
        }
      }

      // Validate the row
      const validation = validateCDRRow({
        timestamp,
        origin,
        destination: dest,
        callType: normalizedType,
        duration,
        billedDuration,
        revenueTTC,
        dataMB,
        rowIndex: i,
      })

      if (!validation.valid) {
        rejectedCount++
        validationErrors.push(...validation.errors)
        continue // Skip invalid rows
      }
      if (validation.warnings.length > 0) {
        warningCount++
        validationWarnings.push(...validation.warnings)
      }

      // Compute record hash for duplicate detection
      const hashInput = `${timestamp.toISOString()}|${origin}|${dest}|${duration ?? ''}|${revenueTTC}`
      const recordHash = createHash('sha256').update(hashInput).digest('hex')

      // Check for duplicates (existing DB + intra-file)
      if (existingHashes.has(recordHash) || newHashes.has(recordHash)) {
        duplicateCount++
        rejectedCount++
        if (validationErrors.length < 50) {
          validationErrors.push(`Row ${i}: Duplicate record detected`)
        }
        continue
      }
      newHashes.add(recordHash)

      // Compute HT, TICTECH, and MTT — use historical tax period if available
      const taxRates = getTaxRatesForDate(taxPeriods, timestamp, settings)
      const effectiveTaxDivisor = 1 + taxRates.tvaRate / 100

      let amountHT: number | null = null
      let taxTictech: number | null = null
      let taxMTT: number | null = null
      if (amountHTIdx >= 0 && cols[amountHTIdx]) {
        amountHT = parseFloat(cols[amountHTIdx]) || null
      }
      if (amountHT === null && revenueTTC > 0) {
        amountHT = revenueTTC / effectiveTaxDivisor
      }
      if (amountHT !== null && amountHT > 0) {
        taxTictech = amountHT * (taxRates.tictechRate / 100)
        // Calculate MTT for mobile money / USSD transactions
        const isMobileMoney = normalizedType === 'ussd' || normalizedType === 'mobile-money'
        if (isMobileMoney && settings.mttRate > 0) {
          taxMTT = amountHT * (settings.mttRate / 100)
        }
      }

      // Resolve destination operator
      let destOperator: string | null = null
      if (dest && dest !== 'BATCH') {
        destOperator = await resolveOperator(dest, jurisdiction)
      }

      batch.push({
        companyId,
        callType: normalizedType,
        duration,
        billedDuration,
        dataUsageMB: dataMB,
        timestamp,
        originNumber: origin,
        destinationNumber: dest,
        calculatedRevenue: revenueTTC,
        amountHT,
        taxTictech,
        taxMTT,
        destinationOperator: destOperator,
        recordHash,
        billingType,
        uploadId: upload.id,
        jurisdiction,
      })

      if (batch.length >= batchSize) {
        await prisma.cDRRecord.createMany({ data: batch })
        acceptedCount += batch.length
        batch = []

        // Update progress on upload record every batch
        await prisma.cDRUpload.update({
          where: { id: upload.id },
          data: { recordCount: acceptedCount },
        })
      }
    }

    if (batch.length > 0) {
      await prisma.cDRRecord.createMany({ data: batch })
      acceptedCount += batch.length
    }

    // Build validation summary
    const validationSummary = summarizeValidation({
      accepted: acceptedCount,
      rejected: rejectedCount,
      warnings: warningCount,
      errors: validationErrors,
      warningMessages: validationWarnings,
    })

    await prisma.cDRUpload.update({
      where: { id: upload.id },
      data: {
        status: 'completed',
        recordCount: acceptedCount,
        acceptedCount,
        rejectedCount,
        warningCount,
        validationReport: JSON.stringify({
          ...validationSummary,
          duplicatesDetected: duplicateCount,
          fileHash,
        }),
        processedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPLOAD',
        entity: 'CDRUpload',
        entityId: upload.id,
        details: `Uploaded ${acceptedCount} CDR records for ${company.name} from ${file.name} (hash: ${fileHash.substring(0, 12)}..., rejected: ${rejectedCount}, duplicates: ${duplicateCount})`,
      },
    })

    return NextResponse.json({
      id: upload.id,
      recordCount: acceptedCount,
      acceptedCount,
      rejectedCount,
      warningCount,
      duplicatesDetected: duplicateCount,
      fileHash,
      status: 'completed',
      validation: validationSummary,
    }, { status: 201 })
  } catch (error) {
    console.error('Upload POST error:', error)
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
  }
}

/**
 * Look up a company-specific rate plan for a given service type and date.
 * Returns the most recent rate plan that is active for the given date, or null.
 */
function getRateForService(
  ratePlans: Array<{ serviceType: string; rate: number; startDate: Date; endDate: Date | null }>,
  serviceType: string,
  date: Date
): { serviceType: string; rate: number } | null {
  // Map normalized call types to rate plan service types
  const serviceMap: Record<string, string> = {
    'voice': 'voice', 'voice-onnet': 'voice', 'voice-offnet': 'voice',
    'sms': 'sms', 'sms-national': 'sms', 'sms-intl': 'sms',
    'data': 'data',
    'international': 'international', 'incoming-intl': 'international', 'voice-intl-outgoing': 'international',
    'recharge': 'recharge', 'subscription': 'subscription',
    'roaming-voice': 'roaming', 'roaming-sms': 'roaming',
    'ussd': 'mobile-money', 'mobile-money': 'mobile-money',
  }

  const mappedType = serviceMap[serviceType] || serviceType

  for (const plan of ratePlans) {
    if (plan.serviceType !== mappedType) continue
    if (plan.startDate <= date && (!plan.endDate || plan.endDate >= date)) {
      return { serviceType: mappedType, rate: plan.rate }
    }
  }
  return null
}

/**
 * Get tax rates (TVA + TICTECH) for a specific date.
 * Falls back to global settings if no matching tax period found.
 */
function getTaxRatesForDate(
  taxPeriods: Array<{ tvaRate: number; tictechRate: number; startDate: Date; endDate: Date | null }>,
  date: Date,
  settings: { taxTTC: number; tictechRate: number }
): { tvaRate: number; tictechRate: number } {
  for (const period of taxPeriods) {
    if (period.startDate <= date && (!period.endDate || period.endDate >= date)) {
      return { tvaRate: period.tvaRate, tictechRate: period.tictechRate }
    }
  }
  return { tvaRate: settings.taxTTC, tictechRate: settings.tictechRate }
}

/**
 * Normalize call type strings to standard categories.
 * Supports English, French, and various CDR naming conventions.
 */
function normalizeCallType(raw: string): string {
  const t = (raw || '').toLowerCase().trim()

  // Mobile Money (must check before USSD since mobile money is a specific USSD use case)
  if (t.includes('mobile-money') || t.includes('mobile_money') || t.includes('mobilemoney')
    || t.includes('mvola') || t.includes('orange money') || t.includes('orange_money')
    || t.includes('airtel money') || t.includes('airtel_money')
    || t.includes('m-pesa') || t.includes('mpesa')) return 'mobile-money'

  // USSD
  if (t.includes('ussd') || t === 'ussd_session' || t === 'ussd-session') return 'ussd'

  // Recharge
  if (t.includes('recharge') || t.includes('rechargement') || t.includes('topup') || t.includes('top-up')) return 'recharge'

  // Subscription
  if (t.includes('subscription') || t.includes('abonnement') || t.includes('forfait') || t.includes('sav')) return 'subscription'

  // Roaming
  if (t.includes('roaming') && t.includes('sms')) return 'roaming-sms'
  if (t.includes('roaming')) return 'roaming-voice'

  // International incoming
  if (t.includes('incoming') && t.includes('int')) return 'incoming-intl'
  if (t.includes('entrant') && t.includes('int')) return 'incoming-intl'

  // International outgoing
  if ((t.includes('sortant') || t.includes('outgoing')) && t.includes('int')) return 'voice-intl-outgoing'

  // SMS
  if ((t.includes('sms') || t.includes('text')) && (t.includes('int') || t.includes('international'))) return 'sms-intl'
  if (t.includes('sms') || t.includes('text')) return 'sms-national'

  // Voice
  if (t.includes('on-net') || t.includes('onnet') || t.includes('on net')) return 'voice-onnet'
  if (t.includes('off-net') || t.includes('offnet') || t.includes('off net')) return 'voice-offnet'
  if (t.includes('voice') || t.includes('call') || t.includes('appel') || t.includes('voix')) return 'voice'

  // Data
  if (t.includes('data') || t.includes('internet') || t.includes('donnee') || t.includes('données')) return 'data'

  // International (generic)
  if (t.includes('intl') || t.includes('international')) return 'international'

  return 'voice' // default
}
