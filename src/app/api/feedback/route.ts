import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createFeedback } from "@/services/feedback.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

const CreateFeedbackSchema = z.object({
  type: z.enum(["suggestion", "bug"]),
  message: z.string().min(1, "Message is required").max(2000),
});

export async function POST(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`feedback:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = CreateFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.message?.[0] ?? "Invalid input" },
      { status: 400 }
    );
  }

  const privyUserId = await getVerifiedPrivyUserId(request).catch(() => null);

  const { error } = await createFeedback({
    privyUserId: privyUserId ?? undefined,
    type: parsed.data.type,
    message: parsed.data.message,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
