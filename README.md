# Kurpur

**Your daily financial companion.** A mobile-first Progressive Web App for youth to build disciplined financial habits.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI, Framer Motion
- **Backend:** Supabase (PostgreSQL, Edge Functions)
- **Auth:** Privy (Passwordless)
- **Deploy:** Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

**Option: Run with Docker (recommended if install fails on Windows)**

Install and run inside a Linux container so you avoid path length and file-lock issues:

```bash
docker build -t kurpur .
docker run -p 3000:3000 --env-file .env.local kurpur
```

Then open http://localhost:3000. Create `.env.local` first with your Supabase and Privy keys.

---

**If install fails on Windows** (TAR_ENTRY_ERROR, EPERM, ENOTEMPTY):

1. Close all editors and terminals using the project.
2. Move the project to a **short path** (e.g. `C:\Kurpur`).
3. Delete `node_modules` and `package-lock.json`:
   - **PowerShell:** `Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json`
   - **CMD (as Administrator):** `rmdir /s /q node_modules` then `del package-lock.json`
4. Run install with reduced network/scripts:
   ```bash
   npm install --no-optional --ignore-scripts
   ```
   If that fails, try **pnpm**: `corepack enable` then `pnpm install`, then `pnpm dev`.
5. If EPERM persists, run the terminal **as Administrator** and retry from step 3.

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (server-side only)
- `NEXT_PUBLIC_PRIVY_APP_ID` – Privy app ID

### 3. Set up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the Supabase SQL Editor

### 4. Set up Privy

1. Create an account at [privy.io](https://privy.io)
2. Create an app and add the App ID to `.env.local`

### 5. PWA icons (optional)

For installability, add `icon-192.png` and `icon-512.png` to `public/` and update `public/manifest.json` with the icon entries.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth sync, transactions, user)
│   ├── dashboard/     # Dashboard pages (Home, Activity, Insights, Profile)
│   ├── layout.tsx
│   └── page.tsx       # Landing / auth
├── components/
│   ├── dashboard/     # WalletCard, SpendingOverview, AddTransactionSheet, etc.
│   ├── providers/     # Privy provider
│   └── ui/            # Button and base components
├── constants/         # Categories
├── lib/
│   ├── finance-engine.ts
│   └── utils.ts
└── types/             # Database types
```

## Features

- **Authentication** – Privy passwordless login
- **Dashboard** – Balance, spending summary, savings meter
- **Add Transaction** – Income/expense with categories
- **Activity** – Transaction history grouped by date
- **Insights** – Financial score, burn rate, spending by category
- **Profile** – Account settings, sign out

## Documentation

- [PRD](kurpur_prd.md)
- [Engineering Doc](youth_financial_assistant_engineering_doc.md)
- [Implementation Plan](kurpur_implementation_plan.md)
- [UI/UX Design](kurpur_ui_ux_design_document.md)
