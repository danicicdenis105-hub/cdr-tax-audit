import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireMutatingAuth } from '@/lib/auth'
import { getActiveJurisdiction } from '@/lib/analysis-engine'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    const jurisdiction = await getActiveJurisdiction()
    const companies = await prisma.telecomCompany.findMany({
      where: { jurisdiction },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error('Companies GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { name, licenseNumber, region, contactEmail, contactPhone, taxId } = body

    if (!name || !licenseNumber || !region || !contactEmail || !taxId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for duplicate license number
    const existing = await prisma.telecomCompany.findUnique({
      where: { licenseNumber },
    })
    if (existing) {
      return NextResponse.json({ error: 'License number already registered' }, { status: 409 })
    }

    const jurisdiction = await getActiveJurisdiction()
    const company = await prisma.telecomCompany.create({
      data: {
        name,
        licenseNumber,
        region,
        contactEmail,
        contactPhone: contactPhone || '',
        taxId,
        jurisdiction,
        status: 'active',
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        entity: 'TelecomCompany',
        entityId: company.id,
        details: `Registered new company: ${name} (${licenseNumber})`,
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('Companies POST error:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const company = await prisma.telecomCompany.update({
      where: { id },
      data: updates,
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE',
        entity: 'TelecomCompany',
        entityId: id,
        details: `Updated company: ${company.name} - fields: ${Object.keys(updates).join(', ')}`,
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Companies PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}
