import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncUser } from "@/services/user.service";
import { getTransactionsByPrivyUserId } from "@/services/transaction.service";
import { getSavingsByPrivyUserId } from "@/services/user.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

const DashboardSchema = z.object({
  privyUserId: z.string().min(1).optional(),
  email: z.union([z.string().email(), z.null()]).optional(),
});

/**
 * Single endpoint for dashboard data. Uses verified Privy token when present
 * (Privy ↔ Neon link); otherwise falls back to body for backwards compatibility.
 */
export async function POST(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`dashboard:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const verifiedUserId = await getVerifiedPrivyUserId(request);
    const body = await request.json().catch(() => ({}));
    const parsed = DashboardSchema.safeParse(body);
    const privyUserId = verifiedUserId ?? (parsed.success ? parsed.data.privyUserId : null);
    if (!privyUserId) {
      return NextResponse.json(
        { error: "Unauthorized. Send Authorization: Bearer <accessToken> or privyUserId in body." },
        { status: 401 }
      );
    }
    const email = parsed.success ? parsed.data.email : undefined;

    const { user, error: syncError } = await syncUser(privyUserId, email ?? undefined);
    if (syncError) {
      console.error("Dashboard sync error:", syncError);
      return NextResponse.json(
        { error: "Failed to sync user" },
        { status: 500 }
      );
    }

    const [txResult, savings] = await Promise.all([
      getTransactionsByPrivyUserId(privyUserId),
      getSavingsByPrivyUserId(privyUserId),
    ]);

    return NextResponse.json({
      user: user ?? null,
      transactions: txResult.error ? [] : txResult.transactions,
      savings: {
        virtualBalance: savings.virtualBalance,
        batchThreshold: savings.batchThreshold,
      },
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
