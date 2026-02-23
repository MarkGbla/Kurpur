# Kurpur — MVP Readiness & Deploy Guide

This doc reviews whether Kurpur is **MVP ready** and gives a **step-by-step guide** to push to GitHub and deploy on Vercel.

---

## Part 1: MVP Readiness

### PRD core features vs status

| PRD feature | Status | Notes |
|-------------|--------|------|
| **Auth (Privy)** | ✅ Ready | Login, sync to DB on first visit |
| **Dashboard** | ✅ Ready | Wallet card, balance, spending summary, savings meter, quick add |
| **Add transaction** | ✅ Ready | Income/expense, category, saves to Neon |
| **Insights** | ✅ Ready | Burn rate, weekly trend, financial score, spending distribution |
| **Savings system** | ✅ Ready | Virtual ledger, allocation logic, threshold (API ready) |
| **Notifications** | ⚠️ Partial | Edge logic exists; cron + push delivery not required for MVP |

### Technical checklist

- **Database:** Neon PostgreSQL with `users`, `transactions`, `savings_ledger`, `feedback`. Schema in `neon/schema.sql`; run once in Neon SQL Editor.
- **API → DB:** All persistent data flows through API routes → services → Neon (see [APP_TO_DATABASE.md](./APP_TO_DATABASE.md)).
- **Auth:** Privy JWT verified on API routes; `privy_user_id` used for all DB access (no RLS on Neon; app-level scoping).
- **Env:** App needs `DATABASE_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET` in production.

### Optional before first deploy

- **Privy production:** In [Privy Dashboard](https://dashboard.privy.io), add your Vercel production URL to allowed origins so login works in prod.
- **Neon:** Your existing `DATABASE_URL` can be used for production if you’re okay sharing dev/prod DB for MVP; otherwise create a separate Neon project for prod and run `neon/schema.sql` there.

### Verdict

**Yes, MVP ready.** Core flows (auth, dashboard, transactions, insights, savings, settings, feedback) work and persist to the database. You can ship to GitHub and Vercel and iterate from there.

---

## Part 2: Push to GitHub

### Step 1: Create a GitHub repo

1. Go to [github.com](https://github.com) and sign in.
2. Click **New repository**.
3. Set **Repository name** (e.g. `kurpur`).
4. Choose **Private** or **Public**.
5. **Do not** add a README, .gitignore, or license (you already have .gitignore).
6. Click **Create repository**.

### Step 2: Initialize Git (if not already)

In your project folder (e.g. `Kurpur`), open a terminal and run:

```powershell
cd "c:\Users\markg\Downloads\Kurpur"
git init
```

If you already ran `git init` before, skip the `git init` step.

### Step 3: Add remote and verify .gitignore

```powershell
git remote add origin https://github.com/YOUR_USERNAME/kurpur.git
```

Replace `YOUR_USERNAME` and `kurpur` with your GitHub username and repo name.

Confirm `.env.local` is **not** tracked (so secrets are never pushed):

```powershell
git status
```

You should **not** see `.env.local` in the list. The project’s `.gitignore` excludes it.

### Step 4: Stage, commit, and push

```powershell
git add .
git status
```

Double-check that no `.env` or `.env.local` file is staged. Then:

```powershell
git commit -m "Initial commit: Kurpur MVP"
git branch -M main
git push -u origin main
```

If GitHub shows a different default branch (e.g. `master`), use that instead of `main`, or create `main` and push to it.

You’re done with GitHub. The code is in the repo without any secrets.

---

## Part 3: Deploy to Vercel

### Step 1: Build locally (recommended)

From the project root:

```powershell
cd "c:\Users\markg\Downloads\Kurpur"
npm run build
```

If the build fails, fix errors before deploying.

### Step 2: Sign in to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).

### Step 3: Import the GitHub repo

1. Click **Add New…** → **Project**.
2. **Import** the `kurpur` (or your repo name) from GitHub.
3. Vercel will detect Next.js. Keep:
   - **Framework Preset:** Next.js
   - **Root Directory:** (leave blank unless the app lives in a subfolder)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** (default)
4. **Do not** deploy yet — you need to add env vars first.

### Step 4: Add environment variables

In the same “Configure Project” screen, open **Environment Variables** and add:

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | Your Neon connection string | From Neon dashboard; use the same or a dedicated prod DB. |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy App ID | Same as in `.env.local` or a separate Privy app for prod. |
| `PRIVY_APP_SECRET` | Your Privy App Secret | **Secret**; never commit. |

Add them for **Production** (and optionally **Preview** if you use branch deploys). Then click **Deploy**.

### Step 5: Configure Privy for production URL

1. After the first deploy, copy your Vercel URL (e.g. `https://kurpur.vercel.app`).
2. In [Privy Dashboard](https://dashboard.privy.io) → your app → **Settings** (or **Allowed origins**):
   - Add `https://your-app.vercel.app` and `https://*.vercel.app` if you use preview URLs.
3. Save. Now login will work on the live site.

### Step 6: Verify deployment

1. Open the Vercel deployment URL.
2. Click **Get Started** and log in with Privy.
3. Add a transaction, open Dashboard and Insights, change budget in Settings.
4. Confirm data persists (check in Neon or by refreshing and seeing the same data).

If anything fails, check Vercel **Functions** and **Logs** for errors (often missing or wrong `DATABASE_URL` or Privy env vars).

---

## Quick reference

- **Repo:** GitHub → new repo → no README/.gitignore.
- **Local:** `git init` → `git remote add origin <repo-url>` → `git add .` → `git commit` → `git push -u origin main`.
- **Secrets:** Never commit `.env.local`; `.gitignore` and `.env.example` are set up for that.
- **Vercel:** Import from GitHub → add `DATABASE_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET` → Deploy.
- **Privy:** Add production (and preview) URLs in Privy dashboard so login works in prod.

After this, you can iterate on the repo and get automatic Vercel deploys on every push to `main`.

---

## Troubleshooting: `Cannot find module './8948.js'` / `./1682.js` (500 on `/`)

This is a **corrupted or out-of-sync `.next` cache**: webpack is looking for chunk files that no longer exist or have different IDs.

**Fix:**

1. **Stop the dev server** (Ctrl+C in the terminal where `npm run dev` or `npm run dev:clean` is running).
2. **Delete the cache:**  
   `npm run clean`  
   or manually remove the `.next` folder.
3. **Start dev again:**  
   `npm run dev`  
   (Use plain `dev` after a clean; avoid `dev:clean` while the server is already running.)

---

## Troubleshooting: `GET http://localhost:3000/ 404` and repeated "check" / setTimeout in console

The root URL returns 404, and a script (often from Privy) keeps retrying, which causes the console spam.

**Fix:**

1. **Stop the dev server** (Ctrl+C).
2. **Free port 3000** (optional): In PowerShell, find what’s using it:  
   `Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess`  
   Then end that process if it’s not your Next dev server.
3. **Clear the Next cache:**  
   `npm run clean`
4. **Start dev again:**  
   `npm run dev`
5. **Open the app in a new Incognito/Private window** at `http://localhost:3000` so the browser doesn’t use an old cached response or service worker.

If you use Docker, restart the container after a clean so it serves a fresh build.

---

## Troubleshooting: Static assets 404 (`layout.css`, `app/page.js`, `main-app.js`) and webpack cache ENOENT

You see **GET / 200** but **404** for `/_next/static/css/app/layout.css`, `/_next/static/chunks/app/page.js`, etc., and warnings like:

- `Caching failed for pack: ENOENT: no such file or directory, lstat '.next/server/app/api'`
- `Resolving '.../.next/server/app/api/.../route' doesn't lead to expected result`

The webpack filesystem cache is out of sync (common on Windows). The project is configured to use **memory cache** in dev to avoid this.

**Fix:**

1. **Stop the dev server** (Ctrl+C).
2. **Remove the whole cache:**  
   `npm run clean`
3. **Start dev again:**  
   `npm run dev`
4. **Wait for the first compile** (e.g. “Compiled / in …” or “Ready”) before opening or refreshing `http://localhost:3000`.

If the problem persists, close other terminals and any IDE file watchers on the project, then run `npm run clean` and `npm run dev` again.
