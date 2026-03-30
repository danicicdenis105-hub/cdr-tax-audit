import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, symbol?: string): string {
  const s = symbol || 'FCFA'
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B ${s}`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ${s}`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K ${s}`
  return `${Math.round(amount)} ${s}`
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-CF', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`
  return `${bytes} bytes`
}
