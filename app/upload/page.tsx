import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { CDRUploader } from '@/components/upload/cdr-uploader'
import { RecentUploads } from '@/components/upload/recent-uploads'
import { UploadStats } from '@/components/upload/upload-stats'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Upload CDR Data" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">CDR Data Management</h2>
            <p className="text-sm text-muted-foreground">
              Upload and manage Call Detail Records from telecommunications providers
            </p>
          </div>

          <div className="space-y-6">
            <UploadStats />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <CDRUploader />
              <RecentUploads />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
