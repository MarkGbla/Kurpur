# Kurpur --- Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** Kurpur\
**Product Type:** Mobile-first Progressive Web App (PWA)\
**Category:** Behavioral Financial Companion Tool

Kurpur is a modern financial habit-building application designed for
youth.\
It is not a banking app. It is not a fintech wallet.

Kurpur helps users: - Track income and expenses - Understand spending
behavior - Build savings discipline - Develop daily financial awareness

The product focuses on simplicity, habit formation, and psychological
reinforcement.

------------------------------------------------------------------------

## 2. Problem Statement

Many young people: - Do not track daily spending - Do not understand
their burn rate - Struggle to build consistent savings habits - Feel
overwhelmed by traditional finance apps

Existing apps are: - Too complex - Too banking-focused - Too
data-heavy - Not designed for habit psychology

Kurpur solves this by being: - Minimal - Clear - Behavioral-first -
Mobile-native in experience

------------------------------------------------------------------------

## 3. Product Goals

### Primary Goals

1.  Make daily financial check-in effortless
2.  Help users build consistent financial awareness
3.  Increase savings discipline
4.  Reduce financial anxiety

### Success Metrics (KPIs)

-   Daily Active Users (DAU)
-   7-day retention rate
-   Average daily transaction logs
-   Savings growth trend
-   Daily open frequency

Target: Users should open Kurpur at least once per day.

------------------------------------------------------------------------

## 4. Target Users

### Primary Audience

-   Youth (16--30 years)
-   Students
-   Early professionals
-   Informal earners

### User Characteristics

-   Mobile-first
-   Limited financial education
-   Irregular income patterns
-   Cash + mobile money usage

------------------------------------------------------------------------

## 5. Core Features (MVP)

### 5.1 Authentication

-   Privy passwordless login
-   Seamless onboarding
-   Auto user sync with database

### 5.2 Dashboard

-   Wallet overview card
-   Current balance display
-   Spending summary
-   Savings indicator
-   Quick add transaction button

### 5.3 Add Transaction

-   Add income
-   Add expense
-   Category selection
-   Minimal input friction
-   Instant UI refresh

### 5.4 Insights

-   Burn rate calculation
-   Weekly trend view
-   Financial score
-   Spending distribution

### 5.5 Savings System

-   Virtual savings ledger
-   Automatic savings allocation logic
-   Threshold notifications

### 5.6 Notifications

-   Daily summary (evening)
-   Positive reinforcement
-   Savings milestone alert

Limit: Maximum 2 notifications per day.

------------------------------------------------------------------------

## 6. Behavioral Psychology Design

Kurpur applies:

-   Positive reinforcement
-   Progress visualization
-   Habit loop formation
-   Minimal cognitive load

Avoid: - Shame messaging - Aggressive financial warnings - Overwhelming
charts

Goal: User feels in control, not judged.

------------------------------------------------------------------------

## 7. User Journey

### Onboarding Flow

Landing → Login via Privy → Short intro → Set baseline cost → Enter
first transaction → Dashboard

### Daily Usage Flow

Open app → View balance → Log transaction → See updated metrics →
Receive evening summary

Target interaction time: Under 30 seconds per session.

------------------------------------------------------------------------

## 8. Non-Functional Requirements

### Performance

-   First load under 2 seconds
-   API response under 200ms
-   Smooth animations (\<16ms frame time)

### Security

-   HTTPS only
-   Row-Level Security (Supabase)
-   Server-side financial calculations
-   Rate limiting

### Accessibility

-   High contrast mode
-   Minimum touch target 44px
-   Screen reader compatibility

------------------------------------------------------------------------

## 9. Technical Stack

Frontend: - Next.js (App Router) - TypeScript - Tailwind CSS - ShadCN
UI - Framer Motion

Backend: - Supabase (PostgreSQL, Auth, Edge Functions)

Authentication: - Privy

Deployment: - Vercel

------------------------------------------------------------------------

## 10. Future Roadmap

Phase 2: - AI spending insights - Personalized financial tips

Phase 3: - Mobile money API integration - Batch savings automation

Phase 4: - Community financial education mode

------------------------------------------------------------------------

## 11. Risks & Mitigation

Risk: Low user retention\
Mitigation: Strong habit loop + daily summary notifications

Risk: Overcomplication\
Mitigation: Strict feature discipline

Risk: Data privacy concerns\
Mitigation: Clear privacy-first communication

------------------------------------------------------------------------

## 12. Product Vision

Kurpur aims to become:

"The daily financial habit app for youth."

Simple. Premium. Calm. Essential.
