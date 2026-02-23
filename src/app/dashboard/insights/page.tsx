"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import {
  calculateBalance,
  calculateBurnRate,
  computeFinancialScore,
} from "@/lib/finance-engine";
import type { Transaction } from "@/types/database";

export default function InsightsPage() {
  const { user, getAccessToken } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState({ virtualBalance: 0, batchThreshold: 1000 });
  const [userInfo, setUserInfo] = useState<{ baseline_cost: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const run = async () => {
      const token = await getAccessToken?.().catch(() => null);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      const [txRes, savingsRes, syncRes] = await Promise.all([
        fetch(`/api/transactions?userId=${user.id}`, { headers }),
        fetch(`/api/user/savings?userId=${user.id}`, { headers }),
        fetch("/api/auth/sync", {
          method: "POST",
          headers,
          body: JSON.stringify({ privyUserId: user.id, email: user.email?.address }),
        }),
      ]);
      if (cancelled) return;
      const [txData, savingsData, syncData] = await Promise.all([
        txRes.json(),
        savingsRes.json(),
        syncRes.json(),
      ]);
      if (cancelled) return;
      setTransactions(txData.transactions ?? []);
      setSavings({
        virtualBalance: savingsData.virtualBalance ?? 0,
        batchThreshold: savingsData.batchThreshold ?? 1000,
      });
      setUserInfo(syncData.user ?? null);
    };
    run().finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, user?.email?.address, getAccessToken]);

  const { income, expense } = calculateBalance(transactions);
  const burnRate = calculateBurnRate(transactions, 7);
  const score = computeFinancialScore(
    burnRate,
    userInfo?.baseline_cost ?? 0,
    savings.virtualBalance,
    transactions.filter((t) => {
      const d = new Date(t.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length
  );

  const categoryTotals = transactions.reduce<Record<string, number>>(
    (acc, t) => {
      if (t.type === "expense") {
        acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
      }
      return acc;
    },
    {}
  );
  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const scoreLabel =
    score >= 80
      ? "Excellent"
      : score >= 70
        ? "Good"
        : score >= 55
          ? "Fair"
          : score >= 40
            ? "Needs work"
            : "At risk";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-card" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-6 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
      <p className="mt-0.5 text-sm text-muted">Your financial overview</p>

      <div className="mt-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-surface-card p-6"
        >
          <p className="text-sm text-muted">Financial Score</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-muted">/ 100</span>
            <span className="ml-1 rounded-full bg-muted/30 px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
              {scoreLabel}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-success"
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Compares your spending to your budget; higher = more on track.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-surface-card p-6"
        >
          <p className="text-sm text-muted">Burn Rate (7 days)</p>
          <p className="mt-1 text-2xl font-bold">
            Le {formatCurrency(burnRate)} / day
          </p>
          <p className="mt-1 text-xs text-muted">Average daily spending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-surface-card p-6"
        >
          <p className="text-sm text-muted">Spending by Category</p>
          {totalExpense === 0 ? (
            <p className="mt-2 text-sm text-muted">No expenses yet</p>
          ) : (
            <div className="mt-3 space-y-2">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => {
                  const pct = (amt / totalExpense) * 100;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-muted">
                          {cat.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium">
                          Le {formatCurrency(amt)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                          className="h-full rounded-full bg-warning/60"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-surface-card p-6"
        >
          <p className="text-sm text-muted">Weekly Summary</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted">Income</p>
              <p className="font-semibold text-success">
                Le {formatCurrency(income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Expense</p>
              <p className="font-semibold text-warning">
                Le {formatCurrency(expense)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
