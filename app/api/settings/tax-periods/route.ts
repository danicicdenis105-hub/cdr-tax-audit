import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireMutatingAuth } from '@/lib/auth'
import { getActiveJurisdiction } from '@/lib/analysis-engine'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const jurisdiction = await getActiveJurisdiction()
    const periods = await prisma.taxPeriod.findMany({
      where: { jurisdiction },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(periods)
  } catch (error) {
    console.error('TaxPeriod GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch tax periods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { name, tvaRate, tictechRate, startDate, endDate } = body

    if (!name || tvaRate == null || tictechRate == null || !startDate) {
      return NextResponse.json({ error: 'Name, TVA rate, secondary tax rate, and start date are required' }, { status: 400 })
    }

    const jurisdiction = await getActiveJurisdiction()
    const period = await prisma.taxPeriod.create({
      data: {
        name,
        tvaRate: parseFloat(tvaRate),
        tictechRate: parseFloat(tictechRate),
        jurisdiction,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        entity: 'TaxPeriod',
        entityId: period.id,
        details: `Created tax period "${name}": TVA ${tvaRate}%, secondary tax ${tictechRate}%`,
      },
    })

    return NextResponse.json(period, { status: 201 })
  } catch (error) {
    console.error('TaxPeriod POST error:', error)
    return NextResponse.json({ error: 'Failed to create tax period' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const period = await prisma.taxPeriod.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE',
        entity: 'TaxPeriod',
        entityId: id,
        details: `Deleted tax period "${period.name}"`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('TaxPeriod DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete tax period' }, { status: 500 })
  }
}
