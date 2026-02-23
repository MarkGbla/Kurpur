# Kurpur --- Implementation Plan

## 1. Project Overview

Kurpur is a mobile-first Progressive Web App (PWA) designed as a
behavioral financial companion tool.

This implementation plan outlines: - Phased development strategy -
Technical execution roadmap - Infrastructure setup - Feature rollout
plan - Timeline and ownership structure

------------------------------------------------------------------------

# 2. Development Phases

## Phase 0 --- Foundation Setup (Week 1)

### Objectives

-   Set up core infrastructure
-   Establish development standards
-   Configure environments

### Tasks

#### 1. Repository Setup

-   Initialize Next.js (App Router + TypeScript)
-   Enable strict mode
-   Configure ESLint + Prettier
-   Setup Husky for pre-commit hooks

#### 2. UI Foundation

-   Install Tailwind CSS
-   Install ShadCN UI
-   Configure global dark theme
-   Create base layout structure

#### 3. Backend Setup

-   Create Supabase project
-   Configure PostgreSQL
-   Enable Row-Level Security (RLS)
-   Create initial database schema

#### 4. Authentication

-   Integrate Privy
-   Implement login flow
-   Sync user to Supabase on first login

Deliverable: Functional authentication + empty dashboard shell

------------------------------------------------------------------------

## Phase 1 --- Core Financial Engine (Week 2--3)

### Objectives

-   Implement transaction system
-   Build dashboard
-   Implement core financial logic

### Tasks

#### 1. Database Tables

-   users
-   transactions
-   savings_ledger

#### 2. Core Services

-   transaction.service.ts
-   financeEngine.service.ts
-   user.service.ts

#### 3. Financial Logic

-   Burn rate calculation
-   Financial score calculation
-   Virtual savings allocation

#### 4. Dashboard UI

-   WalletCard component
-   Spending summary
-   Savings indicator
-   Quick add transaction

Deliverable: Fully functional financial logging system

------------------------------------------------------------------------

## Phase 2 --- Insights & Behavioral Layer (Week 4)

### Objectives

-   Add insights dashboard
-   Implement psychology-based engagement

### Tasks

#### 1. Insights Page

-   Weekly trends
-   Spending breakdown
-   Burn rate visual
-   Financial score meter

#### 2. Engagement Logic

-   Positive reinforcement messages
-   Savings milestone detection
-   Usage streak logic

#### 3. UI Polish

-   Smooth navigation animations (Framer Motion)
-   Micro-interactions
-   Loading skeletons

Deliverable: Insight-driven dashboard with psychological reinforcement

------------------------------------------------------------------------

## Phase 3 --- Notification Engine (Week 5)

### Objectives

-   Implement daily engagement system

### Tasks

#### 1. Scheduler Setup

-   Supabase Edge Function cron job
-   Evening daily summary (9 PM local time)

#### 2. Trigger Logic

-   Savings threshold reached
-   Financial discipline positive message
-   Risk warning (if overspending)

Limit: Maximum 2 notifications per day

Deliverable: Fully operational notification system

------------------------------------------------------------------------

## Phase 4 --- PWA Optimization (Week 6)

### Objectives

-   Installable app experience
-   Offline functionality
-   Performance optimization

### Tasks

-   Configure service worker
-   Enable offline transaction caching
-   Add splash screen
-   Optimize bundle size
-   Lighthouse performance audit

Target: - First load \< 2 seconds - Interaction latency \< 100ms

Deliverable: Installable, optimized PWA

------------------------------------------------------------------------

# 3. Architecture Implementation Details

## Frontend Structure

src/ ├── app/ ├── components/ ├── lib/ ├── services/ ├── hooks/ ├──
types/

Key Patterns: - Separation of domain logic - Reusable UI components -
Clean service abstraction

------------------------------------------------------------------------

# 4. Database Deployment Plan

1.  Deploy initial schema
2.  Enable Row-Level Security
3.  Create policies:
    -   Users can only access their own data
4.  Add indexes for performance:
    -   transactions(user_id)
    -   transactions(timestamp)

------------------------------------------------------------------------

# 5. Security Implementation

-   HTTPS enforced
-   JWT validation middleware
-   Input validation via Zod
-   Rate limiting API routes
-   Server-side financial calculations only

------------------------------------------------------------------------

# 6. Performance Optimization Strategy

-   Dynamic imports
-   Component-level code splitting
-   Memoization where necessary
-   Edge functions for lightweight backend logic

------------------------------------------------------------------------

# 7. Testing Plan

## Unit Tests

-   Financial engine calculations
-   Savings allocation logic

## Integration Tests

-   Transaction creation flow
-   Authentication sync

## Manual QA

-   Add income
-   Add expense
-   Dashboard refresh
-   Offline mode

------------------------------------------------------------------------

# 8. Deployment Strategy

Hosting: - Vercel

Backend: - Supabase Cloud

Environment Separation: - Development - Staging - Production

------------------------------------------------------------------------

# 9. Timeline Summary

Week 1 → Foundation\
Week 2--3 → Core Financial Engine\
Week 4 → Insights & Engagement\
Week 5 → Notification System\
Week 6 → PWA Optimization

Total MVP Build Time: \~6 Weeks

------------------------------------------------------------------------

# 10. Post-Launch Plan

-   Monitor retention metrics
-   Track DAU growth
-   Collect user feedback
-   Optimize habit loop system
-   Prepare for Phase 2 (AI insights)

------------------------------------------------------------------------

# Final Objective

Launch Kurpur as a:

Simple\
Premium\
Behavioral-first\
Daily financial companion for youth
