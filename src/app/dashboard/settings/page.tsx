"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle, Bell, RotateCcw, Trash2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTheme } from "@/components/providers/ThemeProvider";
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
  const [restartOpen, setRestartOpen] = useState(false);
  const [restartSubmitting, setRestartSubmitting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { theme, setTheme } = useTheme();
  const {
    status: pushStatus,
    message: pushMessage,
    subscribe: subscribeToPush,
    supported: pushSupported,
  } = usePushNotifications({ getAccessToken: getAccessToken ?? undefined });

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

  const handleRestartOpenChange = (open: boolean) => {
    setRestartOpen(open);
    if (!open) {
      setRestartError(null);
    }
  };

  const handleRestartConfirm = async () => {
    if (!user?.id) return;
    setRestartSubmitting(true);
    setRestartError(null);
    try {
      const token = await getAccessToken?.().catch(() => null);
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "restart" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to restart account");
      setRestartOpen(false);
      await loadUser();
    } catch (err) {
      setRestartError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRestartSubmitting(false);
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setDeleteConfirmText("");
      setDeleteError(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== "DELETE" || !user?.id) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const token = await getAccessToken?.().catch(() => null);
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "delete" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete account");
      setDeleteOpen(false);
      logout();
      router.replace("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteSubmitting(false);
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
          <p className="text-xs text-muted">Theme</p>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                theme === "dark"
                  ? "bg-accent text-background"
                  : "bg-surface text-muted hover:bg-surface-card"
              )}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                theme === "light"
                  ? "bg-accent text-background"
                  : "bg-surface text-muted hover:bg-surface-card"
              )}
            >
              Light
            </button>
          </div>
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

      {pushSupported && (
        <div className="mt-6 space-y-4 rounded-2xl bg-surface-card p-4">
          <p className="text-xs text-muted">Push notifications</p>
          <p className="text-sm text-muted">
            Get daily summary and reminders (e.g. evening recap). Max 2 per day.
          </p>
          {pushMessage && (
            <p className={cn(
              "text-sm",
              pushStatus === "subscribed" ? "text-success" : pushStatus === "error" || pushStatus === "denied" ? "text-warning" : "text-muted"
            )}>
              {pushMessage}
            </p>
          )}
          {(pushStatus === "prompt" || pushStatus === "error" || pushStatus === "unavailable" || pushStatus === "loading") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => subscribeToPush()}
              disabled={pushStatus === "loading"}
              className="gap-2"
            >
              <Bell className="h-4 w-4" strokeWidth={1.5} />
              {pushStatus === "loading" ? "Enabling…" : pushStatus === "unavailable" ? "Try enable (install PWA first)" : "Enable notifications"}
            </Button>
          )}
          {pushStatus === "subscribed" && (
            <p className="flex items-center gap-2 text-sm text-success">
              <Bell className="h-4 w-4" strokeWidth={1.5} />
              Notifications are on. You can disable them in your browser settings.
            </p>
          )}
          {pushStatus === "unsupported" && (
            <p className="text-sm text-muted">Not available in this browser.</p>
          )}
          {pushStatus === "denied" && (
            <p className="text-sm text-muted">Allow notifications in your browser to re-enable.</p>
          )}
        </div>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setRestartOpen(true)}
          className="w-full gap-2 text-muted hover:bg-surface-card"
        >
          <RotateCcw className="h-5 w-5" strokeWidth={1.5} />
          Restart account
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="w-full gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-5 w-5" strokeWidth={1.5} />
          Delete account
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

      <Dialog.Root open={restartOpen} onOpenChange={handleRestartOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => handleRestartOpenChange(false)}
          />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/20 bg-surface p-4 shadow-xl outline-none">
            <h2 className="text-lg font-semibold">Restart account</h2>
            <p className="mt-0.5 text-sm text-muted">
              Clear all transactions and reset your savings. You keep the same account and can start fresh.
            </p>
            {restartError && (
              <p className="mt-2 text-sm text-warning">{restartError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRestartOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRestartConfirm}
                disabled={restartSubmitting}
                className="flex-1"
              >
                {restartSubmitting ? "Restarting…" : "Restart"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => handleDeleteOpenChange(false)}
          />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/20 bg-surface p-4 shadow-xl outline-none">
            <h2 className="text-lg font-semibold text-red-500">Delete account</h2>
            <p className="mt-0.5 text-sm text-muted">
              This permanently deletes your account and all data. You will need to sign up again to use Kurpur.
            </p>
            <label htmlFor="delete-confirm" className="mt-4 block text-sm text-muted">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-1.5 w-full rounded-xl border border-muted/30 bg-background px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
            {deleteError && (
              <p className="mt-2 text-sm text-warning">{deleteError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting || deleteConfirmText !== "DELETE"}
                className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-500"
              >
                {deleteSubmitting ? "Deleting…" : "Delete forever"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <p className="mt-8 text-center text-xs text-muted">
        Kurpur - Your daily financial companion
      </p>
    </div>
  );
}
