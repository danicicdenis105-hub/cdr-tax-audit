'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: string
  name: string
}

export function CDRUploader() {
  const { authFetch } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    details?: { accepted?: number; rejected?: number; warnings?: number; duplicates?: number; fileHash?: string }
  } | null>(null)

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.tsv'))) {
      setFile(droppedFile)
      setUploadResult(null)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !selectedCompany) return

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', selectedCompany)

      const res = await authFetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok) {
        setUploadResult({
          success: true,
          message: `Successfully processed ${data.acceptedCount?.toLocaleString() || data.recordCount?.toLocaleString()} CDR records`,
          details: {
            accepted: data.acceptedCount,
            rejected: data.rejectedCount,
            warnings: data.warningCount,
            duplicates: data.duplicatesDetected,
            fileHash: data.fileHash,
          },
        })
        setFile(null)
        // Trigger a page refresh event
        window.dispatchEvent(new CustomEvent('cdr-upload-complete'))
      } else {
        setUploadResult({ success: false, message: data.error || 'Upload failed' })
      }
    } catch {
      setUploadResult({ success: false, message: 'Network error during upload' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Upload CDR Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Telecom Company</label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop a CDR file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supported formats: CSV, XLSX, TSV
              </p>
            </>
          )}
          <input
            type="file"
            accept=".csv,.xlsx,.tsv"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileSelect}
          />
        </div>

        <div className="rounded-md bg-secondary/50 p-3">
          <p className="text-xs font-medium text-foreground mb-1">Expected CSV columns:</p>
          <p className="text-xs text-muted-foreground">
            call_type, duration, data_usage_mb, timestamp, origin_number, destination_number, revenue
          </p>
        </div>

        {uploadResult && (
          <div className={`rounded-md p-3 ${
            uploadResult.success ? 'bg-chart-4/10 text-chart-4' : 'bg-destructive/10 text-destructive'
          }`}>
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <p className="text-sm font-medium">{uploadResult.message}</p>
            </div>
            {uploadResult.details && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs pl-6">
                {uploadResult.details.accepted != null && (
                  <span>Accepted: {uploadResult.details.accepted.toLocaleString()}</span>
                )}
                {uploadResult.details.rejected != null && uploadResult.details.rejected > 0 && (
                  <span className="text-destructive">Rejected: {uploadResult.details.rejected.toLocaleString()}</span>
                )}
                {uploadResult.details.warnings != null && uploadResult.details.warnings > 0 && (
                  <span className="text-chart-2">Warnings: {uploadResult.details.warnings.toLocaleString()}</span>
                )}
                {uploadResult.details.duplicates != null && uploadResult.details.duplicates > 0 && (
                  <span>Duplicates: {uploadResult.details.duplicates.toLocaleString()}</span>
                )}
                {uploadResult.details.fileHash && (
                  <span className="col-span-2 font-mono text-[10px] opacity-70 mt-1">
                    SHA-256: {uploadResult.details.fileHash.substring(0, 24)}...
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <Button
          className="w-full"
          disabled={!file || !selectedCompany || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing CDR Data...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Process
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
