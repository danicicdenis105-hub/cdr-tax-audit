import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireMutatingAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    const where = companyId ? { companyId } : {}
    const plans = await prisma.ratePlan.findMany({
      where,
      include: { company: { select: { name: true } } },
      orderBy: [{ companyId: 'asc' }, { serviceType: 'asc' }, { startDate: 'desc' }],
    })
    return NextResponse.json(plans)
  } catch (error) {
    console.error('RatePlan GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch rate plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { companyId, serviceType, rate, unit, startDate, endDate } = body

    if (!companyId || !serviceType || rate == null || !unit || !startDate) {
      return NextResponse.json({ error: 'Company, service type, rate, unit, and start date are required' }, { status: 400 })
    }

    const plan = await prisma.ratePlan.create({
      data: {
        companyId,
        serviceType,
        rate: parseFloat(rate),
        unit,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    const company = await prisma.telecomCompany.findUnique({ where: { id: companyId }, select: { name: true } })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        entity: 'RatePlan',
        entityId: plan.id,
        details: `Created rate plan for ${company?.name}: ${serviceType} at ${rate} ${unit}`,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('RatePlan POST error:', error)
    return NextResponse.json({ error: 'Failed to create rate plan' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.ratePlan.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE',
        entity: 'RatePlan',
        entityId: id,
        details: 'Deleted rate plan',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('RatePlan DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete rate plan' }, { status: 500 })
  }
}
