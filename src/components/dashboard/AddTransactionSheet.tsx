"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils";

const OTHER_CATEGORY_IDS = ["other_income", "other_expense"] as const;
const OTHER_NOTE_MAX_LENGTH = 200;

const LAST_USED_KEY = "kurpur_last_transaction";

interface AddTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  privyUserId: string;
  onSuccess: () => void;
  /** Pre-select type when opening from quick action. */
  initialType?: "income" | "expense";
  /** When set, fetch transaction and prefill; submit will PATCH. */
  editTransactionId?: string | null;
}

function getLastUsed(): { type: "income" | "expense"; category: string; amount: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_USED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { type?: string; category?: string; amount?: string };
    if (parsed?.type === "income" || parsed?.type === "expense") {
      return {
        type: parsed.type,
        category: typeof parsed.category === "string" ? parsed.category : "",
        amount: typeof parsed.amount === "string" ? parsed.amount : "0",
      };
    }
  } catch {}
  return null;
}

function setLastUsed(type: "income" | "expense", category: string, amount: string) {
  try {
    localStorage.setItem(LAST_USED_KEY, JSON.stringify({ type, category, amount }));
  } catch {}
}

export function AddTransactionSheet({
  open,
  onOpenChange,
  privyUserId,
  onSuccess,
  initialType = "expense",
  editTransactionId,
}: AddTransactionSheetProps) {
  const { getAccessToken } = usePrivy();
  const [type, setType] = React.useState<"income" | "expense">(initialType);
  const [category, setCategory] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("0");
  const [note, setNote] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = React.useState(false);

  const isEdit = !!editTransactionId;

  React.useEffect(() => {
    if (open && editTransactionId && privyUserId) {
      setLoadingEdit(true);
      getAccessToken?.()
        .catch(() => null)
        .then((token) =>
          fetch(`/api/transactions/${editTransactionId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        )
        .then((r) => r.json())
        .then((data: { transaction?: { type: string; category: string; amount: number; note: string | null } }) => {
          const t = data.transaction;
          if (t) {
            setType(t.type === "income" ? "income" : "expense");
            setCategory(t.category ?? "");
            setAmount(String(t.amount ?? 0));
            setNote(t.note ?? "");
          }
        })
        .catch(() => setError("Failed to load transaction"))
        .finally(() => setLoadingEdit(false));
      return;
    }
    if (open && !editTransactionId) {
      setType(initialType);
      const last = getLastUsed();
      if (last && last.type === initialType) {
        setCategory(last.category);
        setAmount(last.amount || "0");
      } else {
        setCategory("");
        setAmount("0");
      }
      setNote("");
      setError(null);
    }
  }, [open, initialType, editTransactionId, privyUserId, getAccessToken]);

  const items = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isOtherCategory = category && OTHER_CATEGORY_IDS.includes(category as (typeof OTHER_CATEGORY_IDS)[number]);

  const handleAmountKey = (key: string) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    if (key === "clear") {
      setAmount("0");
      return;
    }
    if (key === "back") {
      setAmount((a) => (a.length > 1 ? a.slice(0, -1) : "0"));
      return;
    }
    if (key === ".") {
      if (!amount.includes(".")) setAmount((a) => a + ".");
      return;
    }
    const num = parseInt(key, 10);
    if (isNaN(num)) return;
    setAmount((a) => (a === "0" ? key : a + key));
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || !category) {
      setError("Enter amount and select a category");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getAccessToken?.().catch(() => null);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (isEdit && editTransactionId) {
        const res = await fetch(`/api/transactions/${editTransactionId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            type,
            category,
            amount: numAmount,
            note: note.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update");
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: privyUserId,
            type,
            category,
            amount: numAmount,
            ...(note.trim() ? { note: note.trim() } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to add transaction");
        setLastUsed(type, category, amount);
      }

      setType("expense");
      setCategory("");
      setAmount("0");
      setNote("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const keypad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "back"],
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-muted/20 bg-surface outline-none">
            <div className="sticky top-0 z-10 flex justify-center bg-surface py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted/40" />
            </div>
            <div className="px-4 pb-8">
              <h2 className="text-xl font-semibold">
                {loadingEdit ? "Loading..." : isEdit ? "Edit Transaction" : "Add Transaction"}
              </h2>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType("income");
                    setCategory("");
                    setNote("");
                  }}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
                    type === "income"
                      ? "bg-success/20 text-success"
                      : "bg-surface-card text-muted"
                  )}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("expense");
                    setCategory("");
                    setNote("");
                  }}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
                    type === "expense"
                      ? "bg-warning/20 text-warning"
                      : "bg-surface-card text-muted"
                  )}
                >
                  Expense
                </button>
              </div>

              <p className="mt-4 text-sm text-muted">Category</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCategory(item.id);
                      if (!OTHER_CATEGORY_IDS.includes(item.id as (typeof OTHER_CATEGORY_IDS)[number])) {
                        setNote("");
                      }
                    }}
                    className={cn(
                      "rounded-xl py-2.5 text-sm font-medium transition-all active:scale-0.97 ring-2 ring-transparent",
                      category === item.id
                        ? "bg-accent text-background ring-accent ring-offset-2 ring-offset-surface"
                        : "bg-surface-card text-muted hover:bg-surface-card/80"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {isOtherCategory && (
                <div className="mt-4">
                  <p className="text-sm text-muted">
                    {type === "income" ? "Where did this come from?" : "What was this for?"}{" "}
                    <span className="font-normal text-muted/80">(optional)</span>
                  </p>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, OTHER_NOTE_MAX_LENGTH))}
                    maxLength={OTHER_NOTE_MAX_LENGTH}
                    placeholder={type === "income" ? "e.g. Sold old phone" : "e.g. One-off purchase"}
                    className="mt-2 w-full rounded-xl border border-muted/30 bg-surface-card px-3 py-2.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="mt-1 text-xs text-muted">{note.length}/{OTHER_NOTE_MAX_LENGTH}</p>
                </div>
              )}

              <p className="mt-4 text-sm text-muted">Amount (Le)</p>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-card px-4 py-3">
                <span className="text-2xl font-bold tracking-tight">
                  Le {formatCurrency(parseFloat(amount) || 0)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {keypad.flat().map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAmountKey(key)}
                    className="flex h-14 items-center justify-center rounded-xl bg-surface-card text-lg font-medium transition-transform active:scale-0.95"
                  >
                    {key === "back" ? "\u232B" : key}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-3 text-sm text-warning">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || loadingEdit || parseFloat(amount) <= 0 || !category}
                className="mt-6 w-full py-3"
              >
                {isSubmitting ? "Saving..." : isEdit ? "Update Transaction" : "Add Transaction"}
              </Button>
            </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
