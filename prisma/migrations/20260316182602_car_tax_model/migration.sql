-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'analyst',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TelecomCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "taxId" TEXT NOT NULL,
    "numberPrefixes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CDRRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "duration" INTEGER,
    "billedDuration" INTEGER,
    "dataUsageMB" REAL,
    "timestamp" DATETIME NOT NULL,
    "originNumber" TEXT NOT NULL,
    "destinationNumber" TEXT NOT NULL,
    "calculatedRevenue" REAL NOT NULL,
    "amountHT" REAL,
    "taxTictech" REAL,
    "destinationOperator" TEXT,
    "uploadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CDRRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TelecomCompany" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CDRRecord_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "CDRUpload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CDRUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "errorMessage" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "CDRUpload_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TelecomCompany" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "reportedRevenue" REAL NOT NULL,
    "voiceRevenue" REAL NOT NULL DEFAULT 0,
    "smsRevenue" REAL NOT NULL DEFAULT 0,
    "dataRevenue" REAL NOT NULL DEFAULT 0,
    "intlRevenue" REAL NOT NULL DEFAULT 0,
    "rechargeRevenue" REAL NOT NULL DEFAULT 0,
    "subscriptionRevenue" REAL NOT NULL DEFAULT 0,
    "roamingRevenue" REAL NOT NULL DEFAULT 0,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TelecomCompany" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "companyId" TEXT,
    "companyCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedLeakage" REAL NOT NULL DEFAULT 0,
    "fileSize" TEXT NOT NULL DEFAULT '0 KB',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TelecomCompany" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "taxTTC" REAL NOT NULL DEFAULT 26,
    "tictechRate" REAL NOT NULL DEFAULT 7,
    "discrepancyThreshold" REAL NOT NULL DEFAULT 5,
    "criticalThreshold" REAL NOT NULL DEFAULT 20,
    "voiceRate" REAL NOT NULL DEFAULT 25,
    "smsRate" REAL NOT NULL DEFAULT 15,
    "dataRate" REAL NOT NULL DEFAULT 0.5,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "uploadNotifications" BOOLEAN NOT NULL DEFAULT false,
    "reportFormat" TEXT NOT NULL DEFAULT 'pdf',
    "dateFormat" TEXT NOT NULL DEFAULT 'dmy',
    "currency" TEXT NOT NULL DEFAULT 'xaf'
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TelecomCompany_licenseNumber_key" ON "TelecomCompany"("licenseNumber");

-- CreateIndex
CREATE INDEX "CDRRecord_companyId_idx" ON "CDRRecord"("companyId");

-- CreateIndex
CREATE INDEX "CDRRecord_callType_idx" ON "CDRRecord"("callType");

-- CreateIndex
CREATE INDEX "CDRRecord_timestamp_idx" ON "CDRRecord"("timestamp");

-- CreateIndex
CREATE INDEX "CDRRecord_uploadId_idx" ON "CDRRecord"("uploadId");

-- CreateIndex
CREATE INDEX "CDRUpload_companyId_idx" ON "CDRUpload"("companyId");

-- CreateIndex
CREATE INDEX "SalesReport_companyId_idx" ON "SalesReport"("companyId");

-- CreateIndex
CREATE INDEX "SalesReport_period_idx" ON "SalesReport"("period");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReport_companyId_period_key" ON "SalesReport"("companyId", "period");

-- CreateIndex
CREATE INDEX "Report_companyId_idx" ON "Report"("companyId");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
