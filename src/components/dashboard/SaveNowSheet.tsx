"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface SaveNowSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  privyUserId: string;
  initialAmount?: number;
  onSuccess: () => void;
}

export function SaveNowSheet({
  open,
  onOpenChange,
  privyUserId,
  initialAmount = 0,
  onSuccess,
}: SaveNowSheetProps) {
  const { getAccessToken } = usePrivy();
  const [amount, setAmount] = React.useState(string(initialAmount || 0));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setAmount(String(initialAmount || 0));
      setError(null);
    }
  }, [open, initialAmount]);

  const keypad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "back"],
  ];

  const handleKey = (key: string) => {
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
    if (numAmount <= 0) {
      setError("Enter an amount to save");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getAccessToken?.().catch(() => null);
      const res = await fetch("/api/user/savings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: privyUserId,
          amount: numAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-muted/20 bg-surface outline-none">
          <div className="flex justify-center py-3">
            <div className="h-1.5 w-12 rounded-full bg-muted/40" />
          </div>
          <div className="px-4 pb-8">
            <h2 className="text-xl font-semibold">Save Now</h2>
            <p className="mt-1 text-sm text-muted">Add to your savings goal</p>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-card px-4 py-3">
              <span className="text-2xl font-bold tracking-tight">
                Le {formatCurrency(numAmount)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {keypad.flat().map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    handleKey(key);
                  }}
                  className="flex h-14 items-center justify-center rounded-xl bg-surface-card text-lg font-medium transition-transform active:scale-0.95"
                >
                  {key === "back" ? "\u232B" : key}
                </button>
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-warning">{error}</p>}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || numAmount <= 0}
              className="mt-6 w-full py-3"
            >
              {isSubmitting ? "Saving..." : "Save Le " + formatCurrency(numAmount)}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
