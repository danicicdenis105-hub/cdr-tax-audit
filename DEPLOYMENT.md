# TerraNode — Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (production) or SQLite (development)

## Development Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Push schema to SQLite
npx prisma db push

# Seed demo data
npx prisma db seed

# Start dev server
npm run dev
```

## Production Deployment

### 1. Database: Switch to PostgreSQL

```bash
# Copy PostgreSQL schema
cp prisma/schema.postgresql.prisma prisma/schema.prisma

# Update .env
DATABASE_URL="postgresql://user:password@host:5432/cdr_tax_audit?schema=public"

# Generate migrations
npx prisma migrate dev --name init

# For subsequent deploys
npx prisma migrate deploy
```

### 2. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (min 32 chars, use `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Full URL of the deployed application |

### 3. Build & Deploy

```bash
# Build
npm run build

# Start production server
npm start
```

### 4. Security Checklist

- [ ] Change `NEXTAUTH_SECRET` to a cryptographically random value
- [ ] Use HTTPS (TLS) in production
- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL with SSL (`?sslmode=require` in DATABASE_URL)
- [ ] Set up database backups
- [ ] Review and restrict CORS if needed
- [ ] Configure rate limiting thresholds for your expected traffic

### 5. Default Credentials

After seeding, the default admin account is:

- Email: `admin@taxauthority.cf`
- Password: `admin123`

**Change this immediately in production.**

## Architecture

- **Framework**: Next.js 15 (App Router)
- **Database**: Prisma ORM (SQLite dev / PostgreSQL prod)
- **Auth**: JWT HTTP-only cookies with CSRF double-submit pattern
- **Tax Model**: CAR dual-tax (TVA + TICTECH) with historical period support
