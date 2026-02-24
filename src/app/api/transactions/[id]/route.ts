import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/services/transaction.service";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getVerifiedPrivyUserId } from "@/lib/privy-server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await (Promise.resolve(context.params) as Promise<{ id: string }>);
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`transactions-get-id:${id}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const verifiedUserId = await getVerifiedPrivyUserId(request);
  if (!verifiedUserId) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <accessToken>." },
      { status: 401 }
    );
  }

  const transactionId = params.id;
  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
  }

  const { transaction, error } = await getTransactionById(verifiedUserId, transactionId);
  if (error || !transaction) {
    return NextResponse.json(
      { error: error ?? "Not found" },
      { status: error === "User not found" || error === "Not found" ? 404 : 500 }
    );
  }
  return NextResponse.json({ transaction });
}

const UpdateTransactionSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  note: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await (Promise.resolve(context.params) as Promise<{ id: string }>);
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`transactions-patch:${id}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const verifiedUserId = await getVerifiedPrivyUserId(request);
  if (!verifiedUserId) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <accessToken>." },
      { status: 401 }
    );
  }

  const transactionId = params.id;
  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = UpdateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { transaction, error } = await updateTransaction(
      verifiedUserId,
      transactionId,
      parsed.data
    );

    if (error) {
      return NextResponse.json(
        { error },
        { status: error === "User not found" || error === "Not found" ? 404 : 500 }
      );
    }
    return NextResponse.json({ transaction });
  } catch (err) {
    console.error("Transaction update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await (Promise.resolve(context.params) as Promise<{ id: string }>);
  const id = getRateLimitIdentifier(request);
  const { success } = rateLimit(`transactions-delete:${id}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const verifiedUserId = await getVerifiedPrivyUserId(request);
  if (!verifiedUserId) {
    return NextResponse.json(
      { error: "Unauthorized. Send Authorization: Bearer <accessToken>." },
      { status: 401 }
    );
  }

  const transactionId = params.id;
  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
  }

  const { error } = await deleteTransaction(verifiedUserId, transactionId);
  if (error) {
    return NextResponse.json(
      { error },
      { status: error === "User not found" || error === "Not found" ? 404 : 500 }
    );
  }
  return NextResponse.json({ success: true });
}
