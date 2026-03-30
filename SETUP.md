# TerraNode - Setup Guide

## Government Revenue Assurance Platform for Telecommunications Tax Auditing

### Prerequisites
- **Node.js 18+** - Download from https://nodejs.org/
- **npm** (comes with Node.js)

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npm run db:setup
   ```
   This creates a local SQLite database, generates the Prisma client, and seeds it with sample telecom company data.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to http://localhost:3000

### Demo Login Credentials
- **Email:** admin@taxauthority.gov
- **Password:** admin123

### Architecture

- **Frontend:** Next.js 15 + React 19 + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** SQLite via Prisma ORM (upgradeable to PostgreSQL for production)
- **Charts:** Recharts

### Key Features

1. **Dashboard** - Overview of tax leakage metrics, revenue comparisons, risk distribution
2. **CDR Upload** - Upload CSV/XLSX files with Call Detail Records for any registered telecom company
3. **Analysis** - Compare CDR-calculated revenue vs reported revenue, filter by company/period/risk
4. **Companies** - Register and manage telecom companies, change statuses, flag for audit
5. **Reports** - Generate, view, and export tax compliance reports
6. **Settings** - Configure tax rates, service rates, notification preferences

### CDR File Format

Upload CSV files with these columns:
```
call_type, duration, data_usage_mb, timestamp, origin_number, destination_number, revenue
```

Supported call types: `voice`, `sms`, `data`, `international`

### Production Deployment

1. Switch database to PostgreSQL:
   - Update `prisma/schema.prisma` provider to `"postgresql"`
   - Set `DATABASE_URL` environment variable
   - Run `npm run db:generate && npx prisma db push`

2. Set secure environment variables:
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `DATABASE_URL` - PostgreSQL connection string

3. Build and start:
   ```bash
   npm run build
   npm start
   ```
