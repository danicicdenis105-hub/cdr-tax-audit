'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Shield className="h-8 w-8 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">CDR Tax Analyzer</span>
          <span className="text-xs text-muted-foreground">Revenue Assurance</span>
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
