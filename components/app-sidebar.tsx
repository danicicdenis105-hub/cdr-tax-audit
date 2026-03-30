'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Activity,
  FileText,
  Building2,
  Settings,
  Shield,
  ScrollText,
  Receipt,
  Globe,
  ChevronDown,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload CDR Data', href: '/upload', icon: Upload },
  { name: 'Analysis', href: '/analysis', icon: BarChart3 },
  { name: 'Revenue Intelligence', href: '/revenue-intelligence', icon: Activity },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Sales Reports', href: '/sales-reports', icon: Receipt },
  { name: 'Audit Log', href: '/audit-log', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface JurisdictionOption {
  code: string
  name: string
  flag: string
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeJurisdiction, setActiveJurisdiction] = useState<string>('CAR')
  const [jurisdictions, setJurisdictions] = useState<JurisdictionOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    fetch('/api/jurisdiction')
      .then(r => {
        if (!r.ok) throw new Error('Not authenticated')
        return r.json()
      })
      .then(data => {
        if (data.active) setActiveJurisdiction(data.active)
        if (data.available) setJurisdictions(data.available)
      })
      .catch(() => {})
  }, [])

  const switchJurisdiction = useCallback(async (code: string) => {
    if (code === activeJurisdiction || switching) return
    setSwitching(true)
    try {
      // Read CSRF token from cookie
      const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/)
      const csrfToken = csrfMatch ? csrfMatch[1] : ''
      const res = await fetch('/api/jurisdiction', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ jurisdiction: code }),
      })
      if (res.ok) {
        setActiveJurisdiction(code)
        setIsOpen(false)
        // Refresh page to reload all data for new jurisdiction
        router.refresh()
        window.location.reload()
      }
    } catch {
      // ignore
    } finally {
      setSwitching(false)
    }
  }, [activeJurisdiction, switching, router])

  const active = jurisdictions.find(j => j.code === activeJurisdiction)

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Shield className="h-8 w-8 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">TerraNode</span>
          <span className="text-xs text-muted-foreground">Revenue Assurance</span>
        </div>
      </div>

      {/* Jurisdiction Switcher */}
      <div className="border-b border-border px-3 py-3">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={switching}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'bg-primary/10 text-primary hover:bg-primary/20',
              switching && 'opacity-50 cursor-wait'
            )}
          >
            <Globe className="h-4 w-4" />
            <span className="flex-1 text-left">
              {active ? `${active.flag} ${active.name}` : 'Loading...'}
            </span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover shadow-lg">
              {jurisdictions.map(j => (
                <button
                  key={j.code}
                  onClick={() => switchJurisdiction(j.code)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent',
                    j.code === activeJurisdiction && 'bg-accent/50 font-medium'
                  )}
                >
                  <span>{j.flag}</span>
                  <span className="flex-1 text-left">{j.name}</span>
                  {j.code === activeJurisdiction && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-md bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Government Portal</p>
          <p className="text-sm font-medium text-sidebar-foreground">Tax Authority</p>
        </div>
      </div>
    </aside>
  )
}
