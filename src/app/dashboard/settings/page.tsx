"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { SUGGESTED_BUDGET_PERCENT, BUDGET_PERCENT_OPTIONS } from "@/constants/budget";
import type { Transaction } from "@/types/database";

function incomeThisMonth(transactions: Transaction[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return transactions
    .filter((t) => {
      if (t.type !== "income") return false;
      const d = new Date(t.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export default function SettingsPage() {
  const { user, logout, getAccessToken } = usePrivy();
  const router = useRouter();
  const [baselineCost, setBaselineCost] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suggestedPercent, setSuggestedPercent] = useState(SUGGESTED_BUDGET_PERCENT);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"suggestion" | "bug">("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const income = incomeThisMonth(transactions);
  const suggestedBudget = income > 0 ? Math.floor(income * (suggestedPercent / 100)) : 0;

  const applySuggested = (percent: number) => {
    setSuggestedPercent(percent);
    if (income > 0) setBaselineCost(String(Math.floor(income * (percent / 100))));
  };

  const loadUser = useCallback(async () => {
    if (!user?.id) return;
    setLoadError(null);
    try {
      const token = await getAccessToken?.().catch(() => null);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      const [syncRes, txRes] = await Promise.all([
        fetch("/api/auth/sync", {
          method: "POST",
          headers,
          body: JSON.stringify({
            privyUserId: user.id,
            email: user.email?.address ?? null,
          }),
        }),
        fetch(`/api/transactions?userId=${user.id}`, { headers }),
      ]);
      const syncData = await syncRes.json();
      const txData = await txRes.json();
      if (syncData.user != null && typeof syncData.user.baseline_cost === "number") {
        setBaselineCost(String(syncData.user.baseline_cost));
      }
      setTransactions(txData.transactions ?? []);
    } catch {
      setLoadError("Failed to load profile");
    }
  }, [user?.id, user?.email?.address, getAccessToken]);

  useEffect(() => {
    if (user?.id) loadUser();
  }, [user?.id, loadUser]);

  const handleSaveBaseline = async () => {
    const num = parseFloat(baselineCost);
    if (isNaN(num) || num < 0 || !user?.id) return;
    setSaving(true);
    try {
      const token = await getAccessToken?.().catch(() => null);
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, baselineCost: num }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleFeedbackOpenChange = (open: boolean) => {
    setFeedbackOpen(open);
    if (!open) {
      setFeedbackMessage("");
      setFeedbackError(null);
      setFeedbackSuccess(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    const msg = feedbackMessage.trim();
    if (!msg) {
      setFeedbackError("Please enter your feedback");
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try {
      const token = await getAccessToken?.().catch(() => null);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: feedbackType, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send feedback");
      setFeedbackSuccess(true);
      setTimeout(() => handleFeedbackOpenChange(false), 1500);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-6 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-0.5 text-sm text-muted">Account settings</p>

      <div className="mt-6 space-y-4 rounded-2xl bg-surface-card p-4">
        <div>
          <p className="text-xs text-muted">Email</p>
          <p className="font-medium">
            {user?.email?.address ?? "Not set"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Wallet</p>
          <p className="font-medium text-muted">
            {user?.wallet ? "Connected" : "Not connected"}
          </p>
        </div>
        <div>
          <label htmlFor="baseline" className="text-xs text-muted">
            Monthly budget (Le)
          </label>
          {income > 0 && (
            <>
              <p className="mt-1 text-xs text-muted">
                Your income this month: Le {formatCurrency(income)}. Suggested budget ({suggestedPercent}%): Le {formatCurrency(suggestedBudget)}.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BUDGET_PERCENT_OPTIONS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={suggestedPercent === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => applySuggested(p)}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
            </>
          )}
          <div className="mt-2 flex gap-2">
            <input
              id="baseline"
              type="number"
              min="0"
              step="100"
              value={baselineCost}
              onChange={(e) => setBaselineCost(e.target.value)}
              className="flex-1 rounded-xl border border-muted/30 bg-background px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. 500000"
            />
            {suggestedBudget > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBaselineCost(String(suggestedBudget))}
                className="shrink-0"
              >
                Use suggested
              </Button>
            )}
          </div>
          <Button
            onClick={handleSaveBaseline}
            disabled={saving}
            className="mt-2"
            size="sm"
          >
            {saving ? "Saving..." : "Save budget"}
          </Button>
          <p className="mt-1.5 text-xs text-muted">
            Used to see if you&apos;re on track and to calculate your financial score.
          </p>
        </div>
      </div>

      {loadError && (
        <p className="mt-2 text-sm text-warning">{loadError}</p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={() => setFeedbackOpen(true)}
          className="w-full gap-2"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
          Send feedback
        </Button>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full gap-2 text-warning hover:bg-warning/10 hover:text-warning"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.5} />
          Sign out
        </Button>
      </div>

      <Dialog.Root open={feedbackOpen} onOpenChange={handleFeedbackOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => handleFeedbackOpenChange(false)}
          />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/20 bg-surface p-4 shadow-xl outline-none">
            <h2 className="text-lg font-semibold">Send feedback</h2>
            <p className="mt-0.5 text-sm text-muted">
              Share a suggestion or report a bug
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setFeedbackType("suggestion")}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
                  feedbackType === "suggestion"
                    ? "bg-accent text-background"
                    : "bg-surface-card text-muted hover:bg-surface-card/80"
                )}
              >
                Suggestion
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType("bug")}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
                  feedbackType === "bug"
                    ? "bg-warning/20 text-warning"
                    : "bg-surface-card text-muted hover:bg-surface-card/80"
                )}
              >
                Bug report
              </button>
            </div>
            <label htmlFor="feedback-message" className="mt-4 block text-sm text-muted">
              Message
            </label>
            <textarea
              id="feedback-message"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder={
                feedbackType === "suggestion"
                  ? "Your suggestion..."
                  : "Describe the bug..."
              }
              rows={4}
              maxLength={2000}
              className="mt-1.5 w-full resize-none rounded-xl border border-muted/30 bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
            {feedbackError && (
              <p className="mt-2 text-sm text-warning">{feedbackError}</p>
            )}
            {feedbackSuccess && (
              <p className="mt-2 text-sm text-success">Thank you! Feedback sent.</p>
            )}
            <Button
              onClick={handleFeedbackSubmit}
              disabled={feedbackSubmitting}
              className="mt-4 w-full"
            >
              {feedbackSubmitting ? "Sending..." : "Send feedback"}
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <p className="mt-8 text-center text-xs text-muted">
        Kurpur - Your daily financial companion
      </p>
    </div>
  );
}
