"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/database";

function EditTransactionLink({
  transactionId,
  onClose,
}: {
  transactionId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        onClose();
        router.push(`/dashboard?edit=${transactionId}`);
      }}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted hover:bg-surface-card hover:text-accent"
    >
      <Pencil className="h-4 w-4" />
      Edit
    </button>
  );
}

type FilterRange = "week" | "month" | "all";

function filterByRange(transactions: Transaction[], range: FilterRange): Transaction[] {
  if (range === "all") return transactions;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "week") cutoff.setDate(cutoff.getDate() - 7);
  else cutoff.setMonth(cutoff.getMonth() - 1);
  return transactions.filter((t) => new Date(t.timestamp) >= cutoff);
}

function searchFilter(transactions: Transaction[], query: string): Transaction[] {
  if (!query.trim()) return transactions;
  const q = query.trim().toLowerCase();
  return transactions.filter(
    (t) =>
      t.category.toLowerCase().includes(q) ||
      (t.note?.toLowerCase().includes(q) ?? false) ||
      String(t.amount).includes(q)
  );
}

export default function ActivityPage() {
  const { user, getAccessToken } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterRange>("all");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    const token = await getAccessToken?.().catch(() => null);
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const r = await fetch(`/api/transactions?userId=${user.id}`, { headers });
    const d = await r.json();
    setTransactions(d.transactions ?? []);
  }, [user?.id, getAccessToken]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchTransactions().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id, fetchTransactions]);

  const filtered = useMemo(() => {
    const byRange = filterByRange(transactions, filter);
    return searchFilter(byRange, search);
  }, [transactions, filter, search]);

  const byDate = useMemo(
    () =>
      filtered.reduce<Record<string, Transaction[]>>((acc, t) => {
        const key = new Date(t.timestamp).toDateString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {}),
    [filtered]
  );

  const dateKeys = useMemo(() => {
    const keys = Object.keys(byDate);
    return keys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [byDate]);

  const runningBalances = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let running = 0;
    const map: Record<string, number> = {};
    for (const t of sorted) {
      const amt = Number(t.amount);
      running += t.type === "income" ? amt : -amt;
      map[t.id] = running;
    }
    return map;
  }, [transactions]);

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleDelete = async (id: string) => {
    const token = await getAccessToken?.().catch(() => null);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      setDeleteConfirmId(null);
      setMenuOpenId(null);
      fetchTransactions();
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-6 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
      <p className="mt-0.5 text-sm text-muted">Your transaction history</p>

      <div className="mt-4 flex gap-2">
        {(["week", "month", "all"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilter(r)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === r
                ? "bg-accent text-background"
                : "bg-surface-card text-muted hover:bg-surface-card/80"
            }`}
          >
            {r === "week" ? "Week" : r === "month" ? "Month" : "All"}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-card px-3 py-2">
        <Search className="h-4 w-4 text-muted" />
        <input
          type="search"
          placeholder="Search category, note, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-card" />
          ))}
        </div>
      ) : dateKeys.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface-card p-8 text-center">
          <p className="text-muted">
            {transactions.length === 0
              ? "No transactions yet. Tap Add Transaction to log one."
              : "No transactions match your filter or search."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {dateKeys.map((dateKey) => (
            <section key={dateKey}>
              <p className="mb-2 text-sm font-medium text-muted">
                {formatDate(byDate[dateKey][0].timestamp)}
              </p>
              <div className="space-y-2">
                {byDate[dateKey].map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-surface-card px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          t.type === "income"
                            ? "bg-success/20 text-success"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {t.type === "income" ? (
                          <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
                        ) : (
                          <TrendingDown className="h-5 w-5" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium capitalize">
                          {t.category.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(t.timestamp).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {t.note?.trim() && (
                          <p className="mt-0.5 truncate text-xs text-muted italic">
                            {t.note.trim()}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted">
                          Balance: Le {formatCurrency(runningBalances[t.id] ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <p
                        className={`font-semibold ${
                          t.type === "income" ? "text-success" : "text-warning"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}Le {formatCurrency(Number(t.amount))}
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenId(menuOpenId === t.id ? null : t.id)
                          }
                          className="rounded-lg p-1.5 text-muted hover:bg-muted/20 hover:text-accent"
                          aria-label="Actions"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {menuOpenId === t.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              aria-hidden
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-muted/20 bg-surface py-1 shadow-lg">
                              <EditTransactionLink
                                transactionId={t.id}
                                onClose={() => setMenuOpenId(null)}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setDeleteConfirmId(t.id);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-warning hover:bg-surface-card"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog.Root
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/20 bg-surface p-6">
            <p className="font-medium">Delete transaction?</p>
            <p className="mt-1 text-sm text-muted">This cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-warning hover:bg-warning/90"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
