import { getNeonDb } from "@/lib/neon";

export type FeedbackType = "suggestion" | "bug";

export async function createFeedback(
  params: {
    privyUserId?: string | null;
    type: FeedbackType;
    message: string;
  }
) {
  const sql = getNeonDb();

  await sql`
    INSERT INTO feedback (privy_user_id, type, message)
    VALUES (${params.privyUserId ?? null}, ${params.type}, ${params.message.trim()})
  `;

  return { error: undefined };
}
