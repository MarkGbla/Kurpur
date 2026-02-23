import { getNeonDb } from "@/lib/neon";
import type { Transaction } from "@/types/database";

export async function getTransactionsByPrivyUserId(
  privyUserId: string,
  limit = 100
) {
  const sql = getNeonDb();

  const userRows = await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `;
  const user = userRows[0] as { id: string } | undefined;
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

  const userRows = await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `;
  const user = userRows[0] as { id: string } | undefined;
  if (!user) return { transaction: null, error: "User not found" };

  const inserted = await sql`
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
  `;

  const transaction = inserted[0] as Transaction | undefined;
  return { transaction: transaction ?? null, error: undefined };
}
