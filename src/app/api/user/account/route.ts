import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteAccount, restartAccount } from "@/services/user.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

const AccountActionSchema = z.object({
  action: z.enum(["delete", "restart"]),
});

async function deletePrivyUser(privyUserId: string): Promise<boolean> {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) return false;
  const auth = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const res = await fetch(`https://api.privy.io/v1/users/${privyUserId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${auth}`,
      "privy-app-id": appId,
    },
  });
  return res.ok || res.status === 404;
}

export async function POST(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`user-account:${id}`);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = AccountActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid action. Use delete or restart." },
      { status: 400 }
    );
  }

  const { action } = parsed.data;

  try {
    if (action === "delete") {
      const { ok, error } = await deleteAccount(verifiedUserId);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      await deletePrivyUser(verifiedUserId);
      return NextResponse.json({ ok: true });
    }

    if (action === "restart") {
      const { ok, error } = await restartAccount(verifiedUserId);
      if (!ok) {
        return NextResponse.json(
          { error: error ?? "Failed to restart account" },
          { status: error === "User not found" ? 404 : 500 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Account action error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
