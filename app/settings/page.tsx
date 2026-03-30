'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SettingsData {
  taxTTC: number
  tictechRate: number
  discrepancyThreshold: number
  criticalThreshold: number
  voiceRate: number
  smsRate: number
  dataRate: number
  ussdRate: number
  mttRate: number
  emailAlerts: boolean
  weeklyReports: boolean
  uploadNotifications: boolean
  reportFormat: string
  dateFormat: string
  currency: string
}

interface TaxPeriod {
  id: string
  name: string
  tvaRate: number
  tictechRate: number
  startDate: string
  endDate: string | null
}

interface RatePlan {
  id: string
  companyId: string
  company?: { name: string }
  serviceType: string
  rate: number
  unit: string
  startDate: string
  endDate: string | null
}

interface Company {
  id: string
  name: string
}

interface JurisdictionInfo {
  active: string
  activeConfig: {
    code: string
    name: string
    flag: string
    currency: { code: string; symbol: string }
    taxes: {
      primary: { name: string; code: string; rate: number }
      secondary: { name: string; code: string; rate: number }
    }
  }
}

const defaultSettings: SettingsData = {
  taxTTC: 26, tictechRate: 7, discrepancyThreshold: 5, criticalThreshold: 20,
  voiceRate: 25, smsRate: 15, dataRate: 0.5, ussdRate: 0, mttRate: 0,
  emailAlerts: true, weeklyReports: true, uploadNotifications: false,
  reportFormat: 'pdf', dateFormat: 'dmy', currency: 'xaf',
}

export default function SettingsPage() {
  const { authFetch } = useAuth()
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [jurisdictionInfo, setJurisdictionInfo] = useState<JurisdictionInfo | null>(null)

  // Tax periods state
  const [taxPeriods, setTaxPeriods] = useState<TaxPeriod[]>([])
  const [newPeriod, setNewPeriod] = useState({ name: '', tvaRate: '', tictechRate: '', startDate: '', endDate: '' })

  // Rate plans state
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [newPlan, setNewPlan] = useState({ companyId: '', serviceType: '', rate: '', unit: 'per_minute', startDate: '', endDate: '' })

  // Jurisdiction labels
  const primaryTaxName = jurisdictionInfo?.activeConfig?.taxes?.primary?.name || 'TVA (TTC)'
  const secondaryTaxName = jurisdictionInfo?.activeConfig?.taxes?.secondary?.name || 'TICTECH'
  const currencySymbol = jurisdictionInfo?.activeConfig?.currency?.symbol || 'XAF'
  const countryName = jurisdictionInfo?.activeConfig?.name || 'Central African Republic'

  useEffect(() => {
    fetch('/api/jurisdiction').then(r => r.json()).then(data => {
      if (data && !data.error) setJurisdictionInfo(data)
    }).catch(() => {})

    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data && !data.error) setSettings(prev => ({ ...prev, ...data }))
    }).catch(() => {})

    fetch('/api/settings/tax-periods').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setTaxPeriods(data)
    }).catch(() => {})

    fetch('/api/settings/rate-plans').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setRatePlans(data)
    }).catch(() => {})

    fetch('/api/companies').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCompanies(data)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaveMessage('Settings saved successfully')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Failed to save settings')
      }
    } catch {
      setSaveMessage('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => setSettings(defaultSettings)

  const update = (field: keyof SettingsData, value: number | boolean | string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const addTaxPeriod = async () => {
    if (!newPeriod.name || !newPeriod.tvaRate || !newPeriod.tictechRate || !newPeriod.startDate) return
    try {
      const res = await authFetch('/api/settings/tax-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriod),
      })
      if (res.ok) {
        const created = await res.json()
        setTaxPeriods(prev => [created, ...prev])
        setNewPeriod({ name: '', tvaRate: '', tictechRate: '', startDate: '', endDate: '' })
      }
    } catch { /* ignore */ }
  }

  const deleteTaxPeriod = async (id: string) => {
    try {
      await authFetch(`/api/settings/tax-periods?id=${id}`, { method: 'DELETE' })
      setTaxPeriods(prev => prev.filter(p => p.id !== id))
    } catch { /* ignore */ }
  }

  const addRatePlan = async () => {
    if (!newPlan.companyId || !newPlan.serviceType || !newPlan.rate || !newPlan.startDate) return
    try {
      const res = await authFetch('/api/settings/rate-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      })
      if (res.ok) {
        const created = await res.json()
        // Re-fetch to get company name included
        fetch('/api/settings/rate-plans').then(r => r.json()).then(data => {
          if (Array.isArray(data)) setRatePlans(data)
        }).catch(() => {})
        setNewPlan({ companyId: '', serviceType: '', rate: '', unit: 'per_minute', startDate: '', endDate: '' })
      }
    } catch { /* ignore */ }
  }

  const deleteRatePlan = async (id: string) => {
    try {
      await authFetch(`/api/settings/rate-plans?id=${id}`, { method: 'DELETE' })
      setRatePlans(prev => prev.filter(p => p.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Settings" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure {countryName} tax model parameters and system preferences
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-medium">Tax Calculation — {countryName}</CardTitle>
                <CardDescription>TTC/HT dual-tax structure with {secondaryTaxName}</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="tax-ttc">{primaryTaxName} Rate (%)</FieldLabel>
                    <p className="text-xs text-muted-foreground mb-1">Amount HT = Amount TTC / (1 + rate/100)</p>
                    <Input id="tax-ttc" type="number" value={settings.taxTTC} onChange={e => update('taxTTC', parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tictech-rate">{secondaryTaxName} Rate (%)</FieldLabel>
                    <p className="text-xs text-muted-foreground mb-1">Applied on Amount HT</p>
                    <Input id="tictech-rate" type="number" value={settings.tictechRate} onChange={e => update('tictechRate', parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="threshold">Discrepancy Alert Threshold (%)</FieldLabel>
                    <Input id="threshold" type="number" value={settings.discrepancyThreshold} onChange={e => update('discrepancyThreshold', parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="mtt-rate">Mobile Transaction Tax — MTT (%)</FieldLabel>
                    <p className="text-xs text-muted-foreground mb-1">Applied on mobile money / USSD transaction value (HT)</p>
                    <Input id="mtt-rate" type="number" step="0.1" value={settings.mttRate} onChange={e => update('mttRate', parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="critical-threshold">Critical Risk Threshold (%)</FieldLabel>
                    <Input id="critical-threshold" type="number" value={settings.criticalThreshold} onChange={e => update('criticalThreshold', parseFloat(e.target.value) || 0)} />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-medium">Service Rates</CardTitle>
                <CardDescription>Default rates for CDR revenue calculation (in {currencySymbol})</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="voice-rate">Voice Call Rate ({currencySymbol}/min)</FieldLabel>
                    <Input id="voice-rate" type="number" step="1" value={settings.voiceRate} onChange={e => update('voiceRate', parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sms-rate">SMS Rate ({currencySymbol}/message)</FieldLabel>
                    <Input id="sms-rate" type="number" step="1" value={settings.smsRate} onChange={e => update('smsRate', parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="data-rate">Data Rate ({currencySymbol}/MB)</FieldLabel>
                    <Input id="data-rate" type="number" step="0.1" value={settings.dataRate} onChange={e => update('dataRate', parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ussd-rate">USSD Session Rate ({currencySymbol}/session)</FieldLabel>
                    <Input id="ussd-rate" type="number" step="1" value={settings.ussdRate} onChange={e => update('ussdRate', parseFloat(e.target.value) || 0)} />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Historical Tax Periods */}
            <Card className="bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium">Historical Tax Periods</CardTitle>
                <CardDescription>Define different tax rates for different time periods. CDR records will use the matching period&apos;s rates during analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2 items-end">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Period Name</label>
                      <Input placeholder="e.g. 2023 TVA Rate" value={newPeriod.name} onChange={e => setNewPeriod(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">TVA Rate (%)</label>
                      <Input type="number" placeholder="19" value={newPeriod.tvaRate} onChange={e => setNewPeriod(p => ({ ...p, tvaRate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">{secondaryTaxName} Rate (%)</label>
                      <Input type="number" placeholder="7" value={newPeriod.tictechRate} onChange={e => setNewPeriod(p => ({ ...p, tictechRate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                      <Input type="date" value={newPeriod.startDate} onChange={e => setNewPeriod(p => ({ ...p, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">End Date</label>
                      <Input type="date" value={newPeriod.endDate} onChange={e => setNewPeriod(p => ({ ...p, endDate: e.target.value }))} />
                    </div>
                    <Button size="sm" onClick={addTaxPeriod}>
                      <Plus className="mr-1 h-4 w-4" /> Add
                    </Button>
                  </div>

                  {taxPeriods.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="pb-2 text-left font-medium">Name</th>
                            <th className="pb-2 text-right font-medium">TVA %</th>
                            <th className="pb-2 text-right font-medium">{secondaryTaxName} %</th>
                            <th className="pb-2 text-left font-medium">Start</th>
                            <th className="pb-2 text-left font-medium">End</th>
                            <th className="pb-2 text-right font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {taxPeriods.map(period => (
                            <tr key={period.id} className="border-b border-border/50">
                              <td className="py-2 font-medium text-foreground">{period.name}</td>
                              <td className="py-2 text-right font-mono">{period.tvaRate}%</td>
                              <td className="py-2 text-right font-mono">{period.tictechRate}%</td>
                              <td className="py-2 text-muted-foreground">{new Date(period.startDate).toLocaleDateString()}</td>
                              <td className="py-2 text-muted-foreground">{period.endDate ? new Date(period.endDate).toLocaleDateString() : 'Current'}</td>
                              <td className="py-2 text-right">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTaxPeriod(period.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No historical tax periods defined. The global rates above will be used for all records.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Rate Plans */}
            <Card className="bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium">Company Rate Plans</CardTitle>
                <CardDescription>Set company-specific service rates. These override the global rates during CDR processing.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 items-end">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Company</label>
                      <Select value={newPlan.companyId} onValueChange={v => setNewPlan(p => ({ ...p, companyId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Service Type</label>
                      <Select value={newPlan.serviceType} onValueChange={v => setNewPlan(p => ({ ...p, serviceType: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="voice">Voice</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="data">Data</SelectItem>
                          <SelectItem value="international">International</SelectItem>
                          <SelectItem value="roaming">Roaming</SelectItem>
                          <SelectItem value="mobile-money">Mobile Money / USSD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Rate ({currencySymbol})</label>
                      <Input type="number" step="0.1" placeholder="25" value={newPlan.rate} onChange={e => setNewPlan(p => ({ ...p, rate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Unit</label>
                      <Select value={newPlan.unit} onValueChange={v => setNewPlan(p => ({ ...p, unit: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_minute">Per Minute</SelectItem>
                          <SelectItem value="per_message">Per Message</SelectItem>
                          <SelectItem value="per_mb">Per MB</SelectItem>
                          <SelectItem value="per_session">Per Session</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                      <Input type="date" value={newPlan.startDate} onChange={e => setNewPlan(p => ({ ...p, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">End Date</label>
                      <Input type="date" value={newPlan.endDate} onChange={e => setNewPlan(p => ({ ...p, endDate: e.target.value }))} />
                    </div>
                    <Button size="sm" onClick={addRatePlan}>
                      <Plus className="mr-1 h-4 w-4" /> Add
                    </Button>
                  </div>

                  {ratePlans.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="pb-2 text-left font-medium">Company</th>
                            <th className="pb-2 text-left font-medium">Service</th>
                            <th className="pb-2 text-right font-medium">Rate</th>
                            <th className="pb-2 text-left font-medium">Unit</th>
                            <th className="pb-2 text-left font-medium">Start</th>
                            <th className="pb-2 text-left font-medium">End</th>
                            <th className="pb-2 text-right font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {ratePlans.map(plan => (
                            <tr key={plan.id} className="border-b border-border/50">
                              <td className="py-2 font-medium text-foreground">{plan.company?.name || plan.companyId}</td>
                              <td className="py-2 capitalize text-muted-foreground">{plan.serviceType}</td>
                              <td className="py-2 text-right font-mono">{plan.rate}</td>
                              <td className="py-2 text-muted-foreground">{plan.unit.replace('_', ' ')}</td>
                              <td className="py-2 text-muted-foreground">{new Date(plan.startDate).toLocaleDateString()}</td>
                              <td className="py-2 text-muted-foreground">{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Current'}</td>
                              <td className="py-2 text-right">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRatePlan(plan.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No company-specific rate plans defined. Global service rates above will be used.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-medium">Notifications</CardTitle>
                <CardDescription>Configure alert and notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Alerts</p>
                      <p className="text-xs text-muted-foreground">Receive alerts for critical discrepancies</p>
                    </div>
                    <Switch checked={settings.emailAlerts} onCheckedChange={v => update('emailAlerts', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Weekly Reports</p>
                      <p className="text-xs text-muted-foreground">Automated weekly summary emails</p>
                    </div>
                    <Switch checked={settings.weeklyReports} onCheckedChange={v => update('weeklyReports', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload Notifications</p>
                      <p className="text-xs text-muted-foreground">Notify when CDR uploads complete</p>
                    </div>
                    <Switch checked={settings.uploadNotifications} onCheckedChange={v => update('uploadNotifications', v)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base font-medium">Report Settings</CardTitle>
                <CardDescription>Default report generation options</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="report-format">Default Report Format</FieldLabel>
                    <Select value={settings.reportFormat} onValueChange={v => update('reportFormat', v)}>
                      <SelectTrigger id="report-format"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="date-format">Date Format</FieldLabel>
                    <Select value={settings.dateFormat} onValueChange={v => update('dateFormat', v)}>
                      <SelectTrigger id="date-format"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="currency">Currency</FieldLabel>
                    <Select value={settings.currency} onValueChange={v => update('currency', v)}>
                      <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xaf">XAF (FCFA)</SelectItem>
                        <SelectItem value="mga">MGA (Ariary)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (&euro;)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('success') ? 'text-chart-4' : 'text-destructive'}`}>
                {saveMessage}
              </span>
            )}
            <Button variant="outline" onClick={handleReset}>Reset to Defaults</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
