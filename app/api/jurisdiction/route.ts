import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireMutatingAuth } from '@/lib/auth'
import { getJurisdiction, getAllJurisdictions } from '@/lib/jurisdictions'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'global' } })
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 'global' } })
    }

    const active = getJurisdiction(settings.activeJurisdiction)
    const all = getAllJurisdictions()

    return NextResponse.json({
      active: settings.activeJurisdiction,
      activeConfig: active,
      available: all.map(j => ({ code: j.code, name: j.name, flag: j.flag })),
    })
  } catch (error) {
    console.error('Jurisdiction GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch jurisdiction' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const { jurisdiction } = await request.json()
    const config = getJurisdiction(jurisdiction) // throws if invalid

    // Update active jurisdiction and apply its default tax/currency settings
    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        activeJurisdiction: jurisdiction,
        taxTTC: config.taxes.primary.rate,
        tictechRate: config.taxes.secondary.rate,
        currency: config.currency.code.toLowerCase(),
        dateFormat: config.dateFormat,
        voiceRate: config.defaultRates.voiceRate,
        smsRate: config.defaultRates.smsRate,
        dataRate: config.defaultRates.dataRate,
        ussdRate: config.defaultRates.ussdRate,
        mttRate: config.taxes.mtt?.rate ?? 0,
      },
      create: {
        id: 'global',
        activeJurisdiction: jurisdiction,
        taxTTC: config.taxes.primary.rate,
        tictechRate: config.taxes.secondary.rate,
        currency: config.currency.code.toLowerCase(),
        dateFormat: config.dateFormat,
        voiceRate: config.defaultRates.voiceRate,
        smsRate: config.defaultRates.smsRate,
        dataRate: config.defaultRates.dataRate,
        ussdRate: config.defaultRates.ussdRate,
        mttRate: config.taxes.mtt?.rate ?? 0,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'SWITCH_JURISDICTION',
        entity: 'Settings',
        entityId: 'global',
        details: `Switched jurisdiction to ${config.name} (${jurisdiction})`,
      },
    })

    return NextResponse.json({
      active: settings.activeJurisdiction,
      activeConfig: config,
    })
  } catch (error) {
    console.error('Jurisdiction PUT error:', error)
    return NextResponse.json({ error: 'Failed to switch jurisdiction' }, { status: 500 })
  }
}
