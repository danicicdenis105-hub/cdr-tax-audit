import { NextRequest, NextResponse } from 'next/server'
import { verifySession, clearSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = verifySession(request)

  if (session) {
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: session.userId,
        details: `User logged out: ${session.email}`,
      },
    })
  }

  const { sessionCookie, csrfCookie } = clearSession()

  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', sessionCookie)
  response.headers.append('Set-Cookie', csrfCookie)

  return response
}
