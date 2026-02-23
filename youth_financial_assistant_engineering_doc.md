# Youth Financial Assistant --- Engineering Documentation

## 1. System Overview

The Youth Financial Assistant is a mobile-first Progressive Web
Application (PWA) designed to help youth in Sierra Leone manage personal
finances intelligently.

The system is built as a behavioral financial companion tool --- not a
banking platform.

------------------------------------------------------------------------

## 2. Technology Stack

### Frontend

-   Next.js (App Router)
-   TypeScript (Strict Mode)
-   Tailwind CSS
-   ShadCN UI

### Backend

-   Supabase (PostgreSQL, Auth, Edge Functions)

### Authentication

-   Privy (Passwordless Auth)

### Deployment

-   Vercel

------------------------------------------------------------------------

## 3. High-Level Architecture

User (PWA) ↓ Next.js Frontend ↓ API Route Handlers / Edge Functions ↓
Supabase Database ↓ Notification Scheduler ↓ Mobile Money API (Future
Phase)

------------------------------------------------------------------------

## 4. Project File Structure

src/ ├── app/ │ ├── dashboard/ │ ├── auth/ │ ├── transactions/ │ ├──
insights/ │ ├── settings/ │ └── layout.tsx │ ├── components/ │ ├── ui/ │
├── financial/ │ ├── dashboard/ │ └── layout/ │ ├── lib/ │ ├── supabase/
│ ├── privy/ │ ├── finance-engine/ │ ├── notification-engine/ │ └──
utils/ │ ├── services/ │ ├── transaction.service.ts │ ├──
user.service.ts │ └── insight.service.ts │ ├── types/ └── workers/

------------------------------------------------------------------------

## 5. Naming Conventions

-   Components → PascalCase
-   Functions → camelCase
-   Constants → UPPER_SNAKE_CASE
-   Database tables → snake_case

------------------------------------------------------------------------

## 6. Database Design

### Users Table

CREATE TABLE users ( id UUID PRIMARY KEY, privy_user_id TEXT UNIQUE,
email TEXT, financial_score INTEGER DEFAULT 50, baseline_cost NUMERIC
DEFAULT 0, created_at TIMESTAMP DEFAULT NOW() );

### Transactions Table

CREATE TABLE transactions ( id UUID PRIMARY KEY, user_id UUID REFERENCES
users(id), type VARCHAR(20), category VARCHAR(50), amount NUMERIC, note
TEXT, status VARCHAR(20), timestamp TIMESTAMP DEFAULT NOW() );

Indexes: - user_id - timestamp - category

### Savings Ledger Table

CREATE TABLE savings_ledger ( id UUID PRIMARY KEY, user_id UUID
REFERENCES users(id), virtual_balance NUMERIC DEFAULT 0, batch_threshold
NUMERIC DEFAULT 1000, transfer_status VARCHAR(20), created_at TIMESTAMP
DEFAULT NOW() );

------------------------------------------------------------------------

## 7. Core Domain Models

User ├── id ├── privyId ├── email ├── financialScore ├── baselineCost

Transaction ├── id ├── userId ├── type ├── category ├── amount ├──
timestamp ├── status

FinancialEngine ├── calculateBurnRate() ├── computeFinancialScore() ├──
allocateSavings() ├── suggestAllowance()

NotificationService ├── scheduleDailySummary() ├──
sendPositiveReinforcement()

------------------------------------------------------------------------

## 8. Use Case Design

Primary User Actions: - Login - View Dashboard - Add Income - Add
Expense - View Insights - Monitor Savings

Automated System Actions: - Burn rate computation - Financial score
calculation - Notification scheduling - Ledger updates

------------------------------------------------------------------------

## 9. User Flow Design

Authentication Flow:

Start ↓ Privy Login ↓ Token Validation ↓ User Sync ↓
Dashboard

Financial Logging Flow:

Add Transaction ↓ Select Category ↓ Enter Amount ↓ Save ↓ Recalculate
Metrics ↓ Update Dashboard

------------------------------------------------------------------------

## 10. PWA Requirements

-   Service Worker
-   Offline ledger caching
-   Installable to Home Screen
-   Fast initial load (\<2s)

------------------------------------------------------------------------

## 11. Security Practices

-   HTTPS enforced
-   JWT session tokens
-   Server-side financial computation
-   Input validation
-   Rate limiting
-   Row-Level Security (Supabase)

------------------------------------------------------------------------

## 12. Performance Targets

-   First Load \< 2s
-   API Response \< 200ms
-   Interaction delay \< 100ms

------------------------------------------------------------------------

## 13. Future Extensions

-   AI Financial Advisor
-   Mobile Money API integration
-   Youth financial education mode

------------------------------------------------------------------------

## Vision

Build a disciplined financial habit system for youth in Sierra Leone.
