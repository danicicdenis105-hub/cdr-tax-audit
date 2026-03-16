'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, ChevronDown, Calendar, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'

interface AppHeaderProps {
  title: string
  onPeriodChange?: (period: string) => void
  onSearch?: (query: string) => void
}

function generatePeriodOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  // Last 12 months
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ label, value })
  }
  // Last 4 quarters
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
  for (let i = 0; i < 4; i++) {
    let q = currentQuarter - i
    let y = now.getFullYear()
    while (q <= 0) { q += 4; y-- }
    options.push({ label: `Q${q} ${y}`, value: `${y}-q${q}` })
  }
  // Current and last year
  options.push({ label: `Full Year ${now.getFullYear()}`, value: `${now.getFullYear()}` })
  options.push({ label: `Full Year ${now.getFullYear() - 1}`, value: `${now.getFullYear() - 1}` })
  return options
}

export function AppHeader({ title, onPeriodChange, onSearch }: AppHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [alertCount, setAlertCount] = useState(0)

  const periodOptions = useMemo(() => generatePeriodOptions(), [])

  // Fetch alert count (high-risk companies)
  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setAlertCount(data.stats.highRiskCompanies || 0)
      })
      .catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim())
      // Default: navigate to companies page with search
      if (!onSearch) {
        router.push(`/companies?search=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handlePeriodSelect = (value: string) => {
    setSelectedPeriod(value)
    onPeriodChange?.(value)
  }

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TA'

  const selectedLabel = periodOptions.find(p => p.value === selectedPeriod)?.label || 'Select Period'

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies, records..."
            className="w-64 bg-secondary pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              {selectedLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            {periodOptions.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => handlePeriodSelect(opt.value)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative" title={`${alertCount} alerts`}>
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {alertCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {userInitials}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-medium text-foreground">{user?.name || 'User'}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user?.role || 'admin'}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
