'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company { id: string; name: string }
interface SalesReport {
  id: string
  companyId: string
  company?: { name: string }
  period: string
  reportedRevenue: number
  voiceRevenue: number
  smsRevenue: number
  dataRevenue: number
  intlRevenue: number
  rechargeRevenue: number
  subscriptionRevenue: number
  roamingRevenue: number
  submittedAt: string
}

export default function SalesReportsPage() {
  const { authFetch } = useAuth()
  const [reports, setReports] = useState<SalesReport[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filterCompany, setFilterCompany] = useState('all')

  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)

  // Manual entry state
  const [newReport, setNewReport] = useState({
    companyId: '', period: '', reportedRevenue: '',
    voiceRevenue: '', smsRevenue: '', dataRevenue: '', intlRevenue: '',
  })
  const [isAdding, setIsAdding] = useState(false)

  const loadReports = useCallback(() => {
    const params = filterCompany !== 'all' ? `?companyId=${filterCompany}` : ''
    fetch(`/api/sales-reports${params}`).then(r => r.json()).then(data => {
      if (data.reports) setReports(data.reports)
    }).catch(() => {})
  }, [filterCompany])

  useEffect(() => {
    fetch('/api/companies').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCompanies(data)
    }).catch(() => {})
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  const handleFileUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await authFetch('/api/sales-reports', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setUploadResult({ success: true, message: `Imported ${data.processed} reports (${data.skipped} skipped)` })
        setFile(null)
        loadReports()
      } else {
        setUploadResult({ success: false, message: data.error || 'Upload failed' })
      }
    } catch {
      setUploadResult({ success: false, message: 'Network error' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualAdd = async () => {
    if (!newReport.companyId || !newReport.period || !newReport.reportedRevenue) return
    setIsAdding(true)
    try {
      const res = await authFetch('/api/sales-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      })
      if (res.ok) {
        setNewReport({ companyId: '', period: '', reportedRevenue: '', voiceRevenue: '', smsRevenue: '', dataRevenue: '', intlRevenue: '' })
        loadReports()
      }
    } catch { /* ignore */ } finally {
      setIsAdding(false)
    }
  }

  const fmt = (n: number) => n > 0 ? `${(n / 1_000_000).toFixed(2)}M` : '-'

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Sales Reports" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Sales Reports</h2>
            <p className="text-sm text-muted-foreground">
              Import declared revenue reports from telecom operators for comparison with CDR analysis
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* CSV Upload */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-medium">Import from CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md bg-secondary/50 p-3">
                  <p className="text-xs font-medium text-foreground mb-1">Expected columns:</p>
                  <p className="text-xs text-muted-foreground">
                    company, period, total/revenue, voice, sms, data, international, recharge, subscription, roaming
                  </p>
                </div>
                <div className="relative flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6">
                  {file ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Select a CSV file</span>
                  )}
                  <input type="file" accept=".csv" className="absolute inset-0 cursor-pointer opacity-0" onChange={e => { setFile(e.target.files?.[0] || null); setUploadResult(null) }} />
                </div>
                {uploadResult && (
                  <div className={`flex items-center gap-2 rounded-md p-2 text-sm ${uploadResult.success ? 'bg-chart-4/10 text-chart-4' : 'bg-destructive/10 text-destructive'}`}>
                    {uploadResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {uploadResult.message}
                  </div>
                )}
                <Button className="w-full" disabled={!file || isUploading} onClick={handleFileUpload}>
                  {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : <><Upload className="mr-2 h-4 w-4" />Import CSV</>}
                </Button>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card className="bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium">Add Report Manually</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Company</label>
                    <Select value={newReport.companyId} onValueChange={v => setNewReport(p => ({ ...p, companyId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Period (YYYY-MM)</label>
                    <Input placeholder="2025-01" value={newReport.period} onChange={e => setNewReport(p => ({ ...p, period: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Total Revenue (XAF)</label>
                    <Input type="number" placeholder="0" value={newReport.reportedRevenue} onChange={e => setNewReport(p => ({ ...p, reportedRevenue: e.target.value }))} />
                  </div>
                  <Button disabled={isAdding} onClick={handleManualAdd}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Voice (XAF)</label>
                    <Input type="number" placeholder="0" value={newReport.voiceRevenue} onChange={e => setNewReport(p => ({ ...p, voiceRevenue: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">SMS (XAF)</label>
                    <Input type="number" placeholder="0" value={newReport.smsRevenue} onChange={e => setNewReport(p => ({ ...p, smsRevenue: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Data (XAF)</label>
                    <Input type="number" placeholder="0" value={newReport.dataRevenue} onChange={e => setNewReport(p => ({ ...p, dataRevenue: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">International (XAF)</label>
                    <Input type="number" placeholder="0" value={newReport.intlRevenue} onChange={e => setNewReport(p => ({ ...p, intlRevenue: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports Table */}
          <Card className="bg-card mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Declared Revenue Reports</CardTitle>
              <div className="w-48">
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Company</th>
                      <th className="pb-2 text-left font-medium">Period</th>
                      <th className="pb-2 text-right font-medium">Total Revenue</th>
                      <th className="pb-2 text-right font-medium">Voice</th>
                      <th className="pb-2 text-right font-medium">SMS</th>
                      <th className="pb-2 text-right font-medium">Data</th>
                      <th className="pb-2 text-right font-medium">Intl</th>
                      <th className="pb-2 text-right font-medium">Recharge</th>
                      <th className="pb-2 text-left font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">{r.company?.name || r.companyId}</td>
                        <td className="py-2 font-mono text-muted-foreground">{r.period}</td>
                        <td className="py-2 text-right font-mono font-medium">{fmt(r.reportedRevenue)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{fmt(r.voiceRevenue)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{fmt(r.smsRevenue)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{fmt(r.dataRevenue)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{fmt(r.intlRevenue)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{fmt(r.rechargeRevenue)}</td>
                        <td className="py-2 text-muted-foreground">{new Date(r.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reports.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No sales reports found. Import a CSV or add reports manually.</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
