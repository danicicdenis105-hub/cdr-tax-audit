'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

interface AddCompanyDialogProps {
  onCompanyAdded?: () => void
}

export function AddCompanyDialog({ onCompanyAdded }: AddCompanyDialogProps) {
  const { authFetch } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [region, setRegion] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('company-name') as string,
      licenseNumber: formData.get('license-number') as string,
      region,
      contactEmail: formData.get('contact-email') as string,
      contactPhone: (formData.get('contact-phone') as string) || '',
      taxId: formData.get('tax-id') as string,
    }

    try {
      const res = await authFetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setOpen(false)
        setRegion('')
        onCompanyAdded?.()
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to register company')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Register New Telecom Company</DialogTitle>
          <DialogDescription>
            Add a new telecommunications provider to the monitoring system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="company-name">Company Name</FieldLabel>
              <Input id="company-name" name="company-name" placeholder="Enter company name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="license-number">License Number</FieldLabel>
              <Input id="license-number" name="license-number" placeholder="e.g., TCN-2024-007" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="region">Operating Region</FieldLabel>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region"><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National</SelectItem>
                  <SelectItem value="Eastern Region">Eastern Region</SelectItem>
                  <SelectItem value="Western Region">Western Region</SelectItem>
                  <SelectItem value="Northern Region">Northern Region</SelectItem>
                  <SelectItem value="Southern Region">Southern Region</SelectItem>
                  <SelectItem value="Central Region">Central Region</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-email">Contact Email</FieldLabel>
              <Input id="contact-email" name="contact-email" type="email" placeholder="compliance@company.com" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-phone">Contact Phone</FieldLabel>
              <Input id="contact-phone" name="contact-phone" type="tel" placeholder="+1 (555) 000-0000" />
            </Field>
            <Field>
              <FieldLabel htmlFor="tax-id">Tax Identification Number</FieldLabel>
              <Input id="tax-id" name="tax-id" placeholder="Enter tax ID" required />
            </Field>
          </FieldGroup>

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !region}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</> : 'Register Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
