'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFileSize } from '@/lib/utils'

interface UploadRecord {
  id: string
  companyId: string
  company: { name: string }
  fileName: string
  fileSize: number
  recordCount: number
  status: string
  uploadedAt: string
  processedAt: string | null
}

const statusConfig = {
  completed: { icon: CheckCircle, label: 'Completed', className: 'text-chart-4' },
  processing: { icon: Clock, label: 'Processing', className: 'text-chart-2' },
  failed: { icon: AlertCircle, label: 'Failed', className: 'text-destructive' },
}

export function RecentUploads() {
  const [uploads, setUploads] = useState<UploadRecord[]>([])

  const fetchUploads = () => {
    fetch('/api/upload')
      .then(res => res.json())
      .then(data => setUploads(data.uploads || []))
      .catch(() => {})
  }

  useEffect(() => {
    fetchUploads()

    const handler = () => fetchUploads()
    window.addEventListener('cdr-upload-complete', handler)
    return () => window.removeEventListener('cdr-upload-complete', handler)
  }, [])

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Recent Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No uploads yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {uploads.slice(0, 10).map(upload => {
              const config = statusConfig[upload.status as keyof typeof statusConfig] || statusConfig.processing
              const StatusIcon = config.icon
              return (
                <div
                  key={upload.id}
                  className="flex items-center justify-between rounded-md border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{upload.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {upload.company.name} &middot; {formatFileSize(upload.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {upload.recordCount.toLocaleString()} records
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-xs ${config.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
