import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncUser } from "@/services/user.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

const SyncSchema = z.object({
  privyUserId: z.string().min(1).optional(),
  email: z.union([z.string().email(), z.null()]).optional(),
});

export async function POST(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`auth-sync:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const verifiedUserId = await getVerifiedPrivyUserId(request);
    const body = await request.json().catch(() => ({}));
    const parsed = SyncSchema.safeParse(body);
    const privyUserId = verifiedUserId ?? (parsed.success ? parsed.data.privyUserId : null);
    if (!privyUserId) {
      return NextResponse.json(
        { error: "Unauthorized. Send Authorization: Bearer <accessToken> or privyUserId in body." },
        { status: 401 }
      );
    }
    const email = parsed.success ? parsed.data.email : undefined;

    const { user, error } = await syncUser(privyUserId, email ?? undefined);

    if (error) {
      console.error("User sync error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Auth sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
