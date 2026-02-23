import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPushToUser } from "@/services/push.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

// Optional: protect with cron secret so only your backend can trigger
const CRON_SECRET = process.env.CRON_SECRET;

const SendSchema = z.object({
  privyUserId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  url: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`push-send:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  const { sent, error } = await sendPushToUser(parsed.data.privyUserId, {
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url,
  });
  if (error) {
    return NextResponse.json(
      { error },
      { status: 503 }
    );
  }
  return NextResponse.json({ sent });
}
