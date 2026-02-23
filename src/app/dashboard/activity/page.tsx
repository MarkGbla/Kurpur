"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "@/types/database";

export default function ActivityPage() {
  const { user, getAccessToken } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const run = async () => {
      const token = await getAccessToken?.().catch(() => null);
      const headers: HeadersInit = {};
      if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`/api/transactions?userId=${user.id}`, { headers });
      const d = await r.json();
      if (!cancelled) setTransactions(d.transactions ?? []);
    };
    run().finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, getAccessToken]);

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

  const byDate = transactions.reduce<Record<string, Transaction[]>>(
    (acc, t) => {
      const key = new Date(t.timestamp).toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-background px-4 pb-6 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
      <p className="mt-0.5 text-sm text-muted">Your transaction history</p>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-surface-card"
            />
          ))}
        </div>
      ) : Object.keys(byDate).length === 0 ? (
        <p className="mt-6 text-center text-muted">No transactions yet</p>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(byDate).map(([dateKey, txs]) => (
            <section key={dateKey}>
              <p className="mb-2 text-sm font-medium text-muted">
                {formatDate(txs[0].timestamp)}
              </p>
              <div className="space-y-2">
                {txs.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
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
                      <div>
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
                          <p className="mt-0.5 text-xs text-muted italic">
                            {t.note.trim()}
                          </p>
                        )}
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        t.type === "income"
                          ? "text-success"
                          : "text-warning"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}Le {formatCurrency(Number(t.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
