import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateUserBaseline } from "@/services/user.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

const UpdateUserSchema = z.object({
  userId: z.string().min(1).optional(),
  baselineCost: z.number().min(0, "baseline must be non-negative"),
});

export async function PATCH(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`user-patch:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const verifiedUserId = await getVerifiedPrivyUserId(request);
    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse({
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
    const { baselineCost } = parsed.data;

    const { user, error } = await updateUserBaseline(userId, baselineCost);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error === "User not found" ? 404 : 500 }
      );
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
