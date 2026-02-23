import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveSubscription } from "@/services/push.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

const SubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

export async function POST(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`push-subscribe:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const verifiedUserId = await getVerifiedPrivyUserId(request);
  if (!verifiedUserId) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <accessToken>." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid subscription" },
      { status: 400 }
    );
  }

  const { error } = await saveSubscription(verifiedUserId, parsed.data.subscription);
  if (error) {
    return NextResponse.json(
      { error },
      { status: error === "User not found" ? 404 : 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
