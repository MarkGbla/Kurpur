# Kurpur --- UI/UX Design Document

## 1. Design Vision

Kurpur is a modern, mobile-first financial companion tool designed for
youth. The visual identity is:

-   Black & white premium aesthetic
-   Minimal, sleek, high-contrast UI
-   Soft gradients and glass surfaces
-   Premium iOS-style icons (not generic)
-   Smooth navigation animations
-   Simple, focused, no clutter

The UI should feel: - Confident - Calm - Intelligent - Premium but
accessible

------------------------------------------------------------------------

## 2. Design System Foundations

### Color System

Primary Background: - Pure Black: #000000

Secondary Surface: - Soft Dark: #111111 - Card Surface: #1A1A1A

Accent: - White: #FFFFFF - Muted Gray: #8A8A8A

Success: - Soft Green: #22C55E

Warning: - Soft Amber: #F59E0B

No bright distracting colors.

------------------------------------------------------------------------

## 3. Typography

Font Stack: - Inter (Primary) - SF Pro (Fallback on iOS)

Hierarchy: - H1: 28px Bold - H2: 22px SemiBold - H3: 18px Medium - Body:
16px Regular - Caption: 13px Regular

Typography must feel premium and spaced.

------------------------------------------------------------------------

## 4. UI Component Library

Core UI Stack:

-   Tailwind CSS
-   ShadCN UI
-   Radix UI Primitives
-   Framer Motion (for animations)
-   Lucide React (only where necessary)
-   Custom iOS-style premium icon pack

Icons must: - Be line-based - Rounded edges - 1.5px stroke - Consistent
weight

No emoji-style or cartoon icons.

------------------------------------------------------------------------

## 5. Layout System

Mobile-first layout.

Grid: - 8px spacing system - 16px screen padding - 20px card radius (2xl
rounded)

Cards: - Subtle inner shadow - Soft gradient overlays - Smooth hover /
tap feedback

------------------------------------------------------------------------

## 6. Navigation Design

Bottom Tab Navigation (4 tabs):

1.  Home
2.  Activity
3.  Insights
4.  Profile

Navigation must: - Animate with fade + slide - Use Framer Motion - Have
smooth page transitions - Preserve scroll position

Micro-interactions: - Button press scale (0.97) - Card subtle lift on
tap

------------------------------------------------------------------------

## 7. Core Screens

### Home Dashboard

Sections:

-   Greeting Header
-   Wallet Card (Primary Focus)
-   Spending Summary
-   Savings Overview
-   Quick Actions
-   Insights Teaser

Wallet Card: - Large balance - Masked account - Smooth gradient black
surface - Subtle glow edge

------------------------------------------------------------------------

### Add Transaction Modal

-   Slide-up sheet
-   Category selection grid
-   Numeric input keypad
-   Smooth confirm animation
-   Immediate UI refresh

------------------------------------------------------------------------

### Insights Screen

-   Clean charts (minimal grid lines)
-   Burn rate display
-   Financial score meter
-   Weekly trend summary

Charts Library: - Recharts (custom styled dark mode)

------------------------------------------------------------------------

## 8. Animation Principles

All animations must:

-   Be under 250ms
-   Ease-out timing
-   Not distract from core task

Animation Tools: - Framer Motion - CSS transitions

Avoid: - Over-bouncing - Long fades - Overly flashy transitions

------------------------------------------------------------------------

## 9. UX Principles

1.  Less friction
2.  Minimal typing
3.  One primary action per screen
4.  Progressive disclosure
5.  Clear financial visibility

Goal: User should log transaction in under 5 seconds.

------------------------------------------------------------------------

## 10. Accessibility

-   Minimum contrast ratio 4.5:1
-   Touchable area minimum 44px
-   Haptic feedback on actions
-   VoiceOver compatibility

------------------------------------------------------------------------

## 11. PWA UX Considerations

-   Install prompt optimized
-   Splash screen dark theme
-   Offline state indicator
-   Skeleton loading animations

------------------------------------------------------------------------

## 12. Psychological UX Design

Behavioral Triggers:

-   Positive reinforcement messages
-   Small win confirmations
-   Clean progress visualization
-   Daily check-in reminder

Avoid: - Shame-based messaging - Red alerts unless critical

------------------------------------------------------------------------

## 13. Component Naming Conventions

Components: - WalletCard.tsx - SpendingOverview.tsx - SavingsMeter.tsx -
TransactionSheet.tsx

Hooks: - useFinancialScore.ts - useTransactions.ts

Services: - notification.service.ts - financeEngine.service.ts

------------------------------------------------------------------------

## 14. Performance Targets

-   First Load \< 2s
-   Animation frame \< 16ms
-   Bundle optimized via dynamic imports

------------------------------------------------------------------------

## 15. Final UX Objective

Kurpur must feel like:

"A calm financial companion you open daily without stress."

Not a banking dashboard. Not a spreadsheet. Not overwhelming.

Simple. Focused. Premium.
