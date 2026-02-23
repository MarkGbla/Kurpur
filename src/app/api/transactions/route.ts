import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTransactionsByPrivyUserId, createTransaction } from "@/services/transaction.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

const CreateTransactionSchema = z.object({
  userId: z.string().min(1).optional(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "category required"),
  amount: z.number().positive("amount must be positive"),
  note: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`transactions-get:${id}`);
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

  const { transactions, error } = await getTransactionsByPrivyUserId(userId);

  if (error) {
    return NextResponse.json(
      { error: error === "User not found" ? error : "Failed to fetch" },
      { status: error === "User not found" ? 404 : 500 }
    );
  }

  return NextResponse.json({ transactions });
}

export async function POST(request: NextRequest) {
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`transactions-post:${id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const verifiedUserId = await getVerifiedPrivyUserId(request);
    const parsed = CreateTransactionSchema.safeParse({
      ...body,
      userId: body.userId ?? body.privyUserId,
    });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const userId = verifiedUserId ?? parsed.data.userId ?? null;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Send Authorization: Bearer <accessToken> or userId in body." },
        { status: 401 }
      );
    }
    const { type, category, amount, note } = parsed.data;

    const { transaction, error } = await createTransaction(userId, {
      type,
      category,
      amount,
      note,
    });

    if (error) {
      const message = typeof error === "string" ? error : error.message;
      return NextResponse.json(
        { error: message },
        { status: message === "User not found" ? 404 : 500 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (err) {
    console.error("Transaction create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
