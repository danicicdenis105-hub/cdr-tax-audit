'use client'

import { useEffect, useState, useCallback } from 'react'
import { Shield, ChevronLeft, ChevronRight, Clock, User, Database, FileText, Settings, Upload, LogIn } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

interface AuditLogEntry {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId: string | null
  details: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const actionIcons: Record<string, typeof Shield> = {
  LOGIN: LogIn,
  CREATE: Database,
  UPDATE: Settings,
  UPLOAD: Upload,
  GENERATE: FileText,
  DEFAULT: Shield,
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-chart-1/20 text-chart-1',
  CREATE: 'bg-chart-4/20 text-chart-4',
  UPDATE: 'bg-chart-2/20 text-chart-2',
  DELETE: 'bg-destructive/20 text-destructive',
  UPLOAD: 'bg-chart-5/20 text-chart-5',
  GENERATE: 'bg-primary/20 text-primary',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 })
  const [filterAction, setFilterAction] = useState('all')
  const [filterEntity, setFilterEntity] = useState('all')

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '25' })
      if (filterAction !== 'all') params.set('action', filterAction)
      if (filterEntity !== 'all') params.set('entity', filterEntity)

      const res = await fetch(`/api/audit-log?${params}`)
      const data = await res.json()
      if (data.logs) setLogs(data.logs)
      if (data.pagination) setPagination(data.pagination)
    } catch {
      // Keep current
    }
  }, [filterAction, filterEntity])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Audit Log" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Audit Trail</h2>
            <p className="text-sm text-muted-foreground">
              Complete record of all system actions for compliance and accountability
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pagination.total}</p>
                    <p className="text-xs text-muted-foreground">Total Actions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-chart-4/10">
                    <User className="h-5 w-5 text-chart-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {logs.filter(l => l.action === 'LOGIN').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Login Events (page)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-chart-2/10">
                    <Clock className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {logs.length > 0 ? formatDate(logs[0].createdAt) : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10">
                    <Database className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pagination.totalPages}</p>
                    <p className="text-xs text-muted-foreground">Pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-4 flex items-center gap-3">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter by action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="UPLOAD">Upload</SelectItem>
                <SelectItem value="GENERATE">Generate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter by entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="TelecomCompany">Company</SelectItem>
                <SelectItem value="CDRUpload">CDR Upload</SelectItem>
                <SelectItem value="Report">Report</SelectItem>
                <SelectItem value="Settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Log Entries */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-medium">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-8 text-center">
                  <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No audit log entries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => {
                    const Icon = actionIcons[log.action] || actionIcons.DEFAULT
                    const colorClass = actionColors[log.action] || 'bg-secondary text-muted-foreground'
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 rounded-md border border-border/50 p-3"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                              {log.action}
                            </span>
                            <span className="text-xs text-muted-foreground">on</span>
                            <span className="text-xs font-medium text-foreground">
                              {log.entity}
                            </span>
                            {log.entityId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                ({log.entityId})
                              </span>
                            )}
                          </div>
                          {log.details && (
                            <p className="mt-0.5 truncate text-sm text-foreground">{log.details}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchLogs(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchLogs(pagination.page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
