'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'analyst' | 'auditor'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  /** Fetch wrapper that includes CSRF token on mutating requests */
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_PATHS = ['/login']

// CSRF token stored in memory after login
let csrfToken: string | null = null

function getCsrfFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/)
  return match ? match[1] : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verify session on mount by calling /api/auth/me (cookie is sent automatically)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then(data => {
        setUser(data.user)
        csrfToken = getCsrfFromCookie()
      })
      .catch(() => {
        setUser(null)
        csrfToken = null
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login')
    }
    if (!isLoading && user && pathname === '/login') {
      router.replace('/')
    }
  }, [user, isLoading, pathname, router])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        csrfToken = data.csrfToken || getCsrfFromCookie()
        return { success: true }
      } else {
        const data = await res.json()
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue even if logout endpoint fails
    }
    setUser(null)
    csrfToken = null
    router.push('/login')
  }, [router])

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)

    // Add CSRF token on mutating methods
    const method = (options.method || 'GET').toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const token = csrfToken || getCsrfFromCookie()
      if (token) {
        headers.set('X-CSRF-Token', token)
      }
    }

    return fetch(url, { ...options, headers })
  }, [])

  // Show loading spinner while verifying session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Block rendering protected routes while unauthenticated
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
