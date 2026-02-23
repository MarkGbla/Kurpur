import { getNeonDb } from "@/lib/neon";
import type { User } from "@/types/database";

export async function syncUser(privyUserId: string, email?: string | null) {
  const sql = getNeonDb();

  const existing = await sql`
    SELECT id, email, financial_score, baseline_cost, created_at
    FROM users
    WHERE privy_user_id = ${privyUserId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return { user: existing[0] as User };
  }

  const newUserRows = await sql`
    INSERT INTO users (privy_user_id, email)
    VALUES (${privyUserId}, ${email ?? null})
    RETURNING id, email, financial_score, baseline_cost, created_at
  `;

  const newUser = newUserRows[0];
  if (!newUser) return { user: null, error: new Error("Insert failed") };

  await sql`
    INSERT INTO savings_ledger (user_id)
    VALUES (${(newUser as { id: string }).id})
  `;

  return { user: newUser as User };
}

export async function getSavingsByPrivyUserId(privyUserId: string) {
  const sql = getNeonDb();

  const userRows = await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `;
  const user = userRows[0] as { id: string } | undefined;
  if (!user) return { virtualBalance: 0, batchThreshold: 1000 };

  const ledgerRows = await sql`
    SELECT virtual_balance, batch_threshold
    FROM savings_ledger
    WHERE user_id = ${user.id}
    LIMIT 1
  `;
  const data = ledgerRows[0] as
    | { virtual_balance: number; batch_threshold: number }
    | undefined;

  return {
    virtualBalance: data ? Number(data.virtual_balance) : 0,
    batchThreshold: data ? Number(data.batch_threshold) : 1000,
  };
}

export async function updateUserBaseline(
  privyUserId: string,
  baselineCost: number
): Promise<{ user: User | null; error?: string }> {
  const sql = getNeonDb();
  const userRows = await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `;
  const user = userRows[0] as { id: string } | undefined;
  if (!user) return { user: null, error: "User not found" };

  const updated = await sql`
    UPDATE users
    SET baseline_cost = ${baselineCost}
    WHERE id = ${user.id}
    RETURNING id, email, financial_score, baseline_cost, created_at
  `;
  const row = updated[0] as User | undefined;
  return { user: row ?? null };
}

export async function addToSavings(
  privyUserId: string,
  amount: number
): Promise<{ virtualBalance: number; error?: string }> {
  if (amount <= 0) {
    return { virtualBalance: 0, error: "Amount must be positive" };
  }
  const sql = getNeonDb();
  const userRows = await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `;
  const user = userRows[0] as { id: string } | undefined;
  if (!user) return { virtualBalance: 0, error: "User not found" };

  const result = await sql`
    UPDATE savings_ledger
    SET virtual_balance = virtual_balance + ${amount}
    WHERE user_id = ${user.id}
    RETURNING virtual_balance
  `;
  const row = result[0] as { virtual_balance: number } | undefined;
  return {
    virtualBalance: row ? Number(row.virtual_balance) : 0,
  };
}
