# How app changes get saved to the database

All changes you make in the Kurpur app that should be stored **are already saved to the Neon database** through API routes and services. This doc shows how each action flows to the DB.

---

## Flow (every change)

```
Your action in the app
    → Browser calls an API route (e.g. POST /api/transactions)
    → API route calls a service (e.g. createTransaction)
    → Service uses getNeonDb() and runs SQL (INSERT/UPDATE/SELECT)
    → Neon (PostgreSQL) stores or returns the data
```

So: **UI → API route → service → Neon DB.** If the API returns success, the change is in the database.

---

## What gets saved where

| What you do in the app | API called | Database (Neon) |
|------------------------|------------|------------------|
| **Log in / open dashboard** | `POST /api/dashboard` or `POST /api/auth/sync` | Creates or finds your row in `users`; creates a row in `savings_ledger` if you’re new. |
| **Add a transaction** (income or expense) | `POST /api/transactions` | Inserts one row into `transactions` (type, category, amount, note, etc.). |
| **Set monthly budget** (Profile → Save budget) | `PATCH /api/user` | Updates `users.baseline_cost` for your user. |
| **Add to savings** (if you add that button) | `PATCH /api/user/savings` | Updates `savings_ledger.virtual_balance` for your user. |

---

## What is only in the app (not in DB)

- **Budget % buttons (10%–90%)** – The number you select (e.g. 80%) is only in React state. It’s used to fill the budget field; the value that’s saved is the **amount** you enter and save (which updates `users.baseline_cost`).
- **Suggested budget** – The “suggested” amount is computed from this month’s income in the app; only the amount you **save** is written to `users.baseline_cost`.

So: **all stored data (transactions, budget amount, user, savings balance) is in the database.** Only the temporary % choice and suggested amount stay in the app until you save.

---

## Making sure changes “reflect” in the database

1. **Use the right env** – In development and production, `DATABASE_URL` in `.env.local` (or your host’s env) must point to your Neon project. If it’s wrong, API calls will fail and nothing will be saved.
2. **Schema is applied** – Run `neon/schema.sql` in the Neon SQL Editor once so the tables (`users`, `transactions`, `savings_ledger`) and indexes exist.
3. **Save in the UI** – For budget, you must tap **“Save budget”** after entering a value; that’s when `PATCH /api/user` runs and updates the DB. Adding a transaction hits the DB when you tap **“Add Transaction”**.

After saving, the app refetches (e.g. dashboard or transactions list), so what you see is what’s in the database.
