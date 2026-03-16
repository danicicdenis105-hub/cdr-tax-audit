import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireMutatingAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = requireAuth(request)
  if (session instanceof NextResponse) return session

  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'global' } })
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 'global' } })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = requireMutatingAuth(request, ['admin'])
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { id: _, ...data } = body

    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE',
        entity: 'Settings',
        entityId: 'global',
        details: `Updated settings: ${Object.keys(data).join(', ')}`,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
