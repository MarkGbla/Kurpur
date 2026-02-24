import { getNeonDb } from "@/lib/neon";
import type { Transaction } from "@/types/database";

export async function getTransactionsByPrivyUserId(
  privyUserId: string,
  limit = 100
) {
  const sql = getNeonDb();

  const userRows = (await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `) as { id: string }[];
  const user = userRows[0];
  if (!user) return { transactions: [], error: "User not found" };

  const rows = await sql`
    SELECT *
    FROM transactions
    WHERE user_id = ${user.id}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;

  return { transactions: rows as Transaction[], error: undefined };
}

export async function createTransaction(
  privyUserId: string,
  params: {
    type: "income" | "expense";
    category: string;
    amount: number;
    note?: string | null;
  }
) {
  const sql = getNeonDb();

  const userRows = (await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `) as { id: string }[];
  const user = userRows[0];
  if (!user) return { transaction: null, error: "User not found" };

  const inserted = (await sql`
    INSERT INTO transactions (user_id, type, category, amount, note, status)
    VALUES (
      ${user.id},
      ${params.type},
      ${params.category},
      ${params.amount},
      ${params.note ?? null},
      'completed'
    )
    RETURNING *
  `) as Transaction[];

  const transaction = inserted[0];
  return { transaction: transaction ?? null, error: undefined };
}

export async function getTransactionById(
  privyUserId: string,
  transactionId: string
): Promise<{ transaction: Transaction | null; error?: string }> {
  const sql = getNeonDb();
  const userRows = (await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `) as { id: string }[];
  const user = userRows[0];
  if (!user) return { transaction: null, error: "User not found" };
  const rows = (await sql`
    SELECT * FROM transactions WHERE user_id = ${user.id} AND id = ${transactionId} LIMIT 1
  `) as Transaction[];
  return { transaction: rows[0] ?? null, error: rows.length === 0 ? "Not found" : undefined };
}

export async function updateTransaction(
  privyUserId: string,
  transactionId: string,
  params: { type?: "income" | "expense"; category?: string; amount?: number; note?: string | null }
) {
  const { transaction: existing, error: fetchErr } = await getTransactionById(privyUserId, transactionId);
  if (fetchErr || !existing) return { transaction: null, error: fetchErr ?? "Not found" };

  const type = params.type ?? existing.type;
  const category = params.category ?? existing.category;
  const amount = params.amount !== undefined ? params.amount : Number(existing.amount);
  const note = params.note !== undefined ? params.note : existing.note;

  const sql = getNeonDb();
  const rows = (await sql`
    UPDATE transactions
    SET type = ${type}, category = ${category}, amount = ${amount}, note = ${note}
    WHERE user_id = ${existing.user_id} AND id = ${transactionId}
    RETURNING *
  `) as Transaction[];
  return { transaction: rows[0] ?? null, error: undefined };
}

export async function deleteTransaction(
  privyUserId: string,
  transactionId: string
) {
  const sql = getNeonDb();
  const userRows = (await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `) as { id: string }[];
  const user = userRows[0];
  if (!user) return { error: "User not found" };

  const result = await sql`
    DELETE FROM transactions
    WHERE user_id = ${user.id} AND id = ${transactionId}
    RETURNING id
  `;
  return { error: (result as { id: string }[]).length === 0 ? "Not found" : undefined };
}
