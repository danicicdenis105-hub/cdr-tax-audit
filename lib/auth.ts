import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'terranode-secret-change-in-production'
const SESSION_COOKIE = 'cdr-session'
const CSRF_COOKIE = 'csrf-token'
const SESSION_EXPIRY = '8h'

export interface SessionUser {
  userId: string
  email: string
  name: string
  role: 'admin' | 'analyst' | 'auditor'
}

/**
 * Sign a JWT token for the given user and return Set-Cookie headers.
 */
export function createSession(user: SessionUser): { sessionCookie: string; csrfCookie: string; csrfToken: string } {
  const csrfToken = crypto.randomBytes(32).toString('hex')

  const token = jwt.sign(
    { userId: user.userId, email: user.email, name: user.name, role: user.role, csrf: csrfToken },
    JWT_SECRET,
    { expiresIn: SESSION_EXPIRY }
  )

  const isProduction = process.env.NODE_ENV === 'production'
  const secure = isProduction ? '; Secure' : ''

  const sessionCookie = `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=28800`
  const csrfCookieValue = `${CSRF_COOKIE}=${csrfToken}; SameSite=Strict; Path=/${secure}; Max-Age=28800`

  return { sessionCookie, csrfCookie: csrfCookieValue, csrfToken }
}

/**
 * Clear session cookies.
 */
export function clearSession(): { sessionCookie: string; csrfCookie: string } {
  return {
    sessionCookie: `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
    csrfCookie: `${CSRF_COOKIE}=; SameSite=Strict; Path=/; Max-Age=0`,
  }
}

/**
 * Verify the session cookie from a request. Returns the user or null.
 */
export function verifySession(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser & { csrf: string }
    return { userId: decoded.userId, email: decoded.email, name: decoded.name, role: decoded.role }
  } catch {
    return null
  }
}

/**
 * Verify the CSRF token for mutating requests.
 * Compares the X-CSRF-Token header against the csrf claim in the JWT.
 */
export function verifyCSRF(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { csrf: string }
    const headerToken = request.headers.get('X-CSRF-Token')
    if (!headerToken || !decoded.csrf) return false
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(decoded.csrf)
    )
  } catch {
    return false
  }
}

type Role = 'admin' | 'analyst' | 'auditor'

/**
 * Require authentication and optionally specific roles.
 * Returns the session user or a NextResponse error.
 */
export function requireAuth(
  request: NextRequest,
  allowedRoles?: Role[]
): SessionUser | NextResponse {
  const session = verifySession(request)
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return session
}

/**
 * Require auth + CSRF validation for mutating requests.
 */
export function requireMutatingAuth(
  request: NextRequest,
  allowedRoles?: Role[]
): SessionUser | NextResponse {
  const session = requireAuth(request, allowedRoles)
  if (session instanceof NextResponse) return session

  if (!verifyCSRF(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  return session
}
