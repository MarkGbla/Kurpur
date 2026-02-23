import { NextRequest, NextResponse } from "next/server";
import { getSavingsByPrivyUserId, addToSavings } from "@/services/user.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";
import { z } from "zod";

const AddSavingsSchema = z.object({
  userId: z.string().min(1).optional(),
  amount: z.number().positive("amount must be positive"),
});

export async function GET(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`user-savings:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const verifiedUserId = await getVerifiedPrivyUserId(request);
  const queryUserId = request.nextUrl.searchParams.get("userId");
  const userId = verifiedUserId ?? queryUserId ?? null;
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <accessToken> or userId query." },
      { status: 401 }
    );
  }

  const savings = await getSavingsByPrivyUserId(userId);
  return NextResponse.json(savings);
}

export async function PATCH(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`user-savings-patch:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const verifiedUserId = await getVerifiedPrivyUserId(request);
    const body = await request.json();
    const parsed = AddSavingsSchema.safeParse({
      ...body,
      userId: body.userId ?? body.privyUserId,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const userId = verifiedUserId ?? parsed.data.userId ?? null;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Send Authorization: Bearer <accessToken> or userId in body." },
        { status: 401 }
      );
    }
    const { amount } = parsed.data;

    const { virtualBalance, error } = await addToSavings(userId, amount);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error === "User not found" ? 404 : 400 }
      );
    }
    return NextResponse.json({ virtualBalance });
  } catch (err) {
    console.error("Savings update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
