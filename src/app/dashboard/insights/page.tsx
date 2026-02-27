"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  calculateBalance,
  calculateBurnRate,
  computeFinancialScoreBreakdown,
  getProjectedEndOfMonthBalance,
  getWeekOverWeekSpending,
  getDailyExpenseTrend,
} from "@/lib/finance-engine";
import type { Transaction } from "@/types/database";

function ScoreHowCalculated({
  breakdown,
}: {
  breakdown: { factors: { label: string; impact: number; description: string }[] };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-muted/20 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm text-muted hover:text-accent"
      >
        How is this calculated?
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="mt-2 space-y-1.5 text-xs text-muted">
              {breakdown.factors.map((f) => (
                <li key={f.label} className="flex justify-between gap-2">
                  <span>{f.label}:</span>
                  <span className="text-right">
                    {f.description}
                    {f.impact !== 0 && (
                      <span className={f.impact > 0 ? "text-success" : "text-warning"}>
                        {" "}
                        ({f.impact > 0 ? "+" : ""}{f.impact})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InsightsPage() {
  const { user, getAccessToken } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState({ virtualBalance: 0, batchThreshold: 1000 });
  const [userInfo, setUserInfo] = useState<{ baseline_cost: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);


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
      setUserInfo(
        syncData.user
          ? { baseline_cost: Number(syncData.user.baseline_cost) || 0 }
          : null
      );
    };
    run().finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, user?.email?.address, getAccessToken]);

  const { income, expense } = calculateBalance(transactions);
  const burnRate = calculateBurnRate(transactions, 7);
  const recentCount = transactions.filter((t) => {
    const d = new Date(t.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;
  const scoreBreakdown = computeFinancialScoreBreakdown(
    burnRate,
    userInfo?.baseline_cost ?? 0,
    savings.virtualBalance,
    recentCount
  );
  const score = scoreBreakdown.score;
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
  const { total: balance } = calculateBalance(transactions);
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = Math.max(0, lastDay.getDate() - now.getDate());
  const projectedEOM = getProjectedEndOfMonthBalance(balance, burnRate, daysRemaining);
  const { thisWeek, lastWeek } = getWeekOverWeekSpending(transactions);
  const dailyTrend7 = getDailyExpenseTrend(transactions, 7);
  const maxDaily = Math.max(1, ...dailyTrend7.map((d) => d.amount));
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

  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const shareSummary = `Kurpur · ${monthName}\nIncome: Le ${formatCurrency(income)}\nExpense: Le ${formatCurrency(expense)}\nScore: ${score}/100`;

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(shareSummary);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

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
          {(userInfo?.baseline_cost ?? 0) > 0 ? (
            <p className="mt-2 text-xs text-muted">
              Monthly budget: Le {formatCurrency(userInfo.baseline_cost)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Set your budget in Profile for a more accurate score.
            </p>
          )}
          {(userInfo?.baseline_cost ?? 0) === 0 && (
            <Link
              href="/dashboard/settings"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Set budget in Profile
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          )}
          <ScoreHowCalculated breakdown={scoreBreakdown} />
          {scoreBreakdown.recommendation && (
            <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
              {scoreBreakdown.recommendation}
            </p>
          )}
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
          {dailyTrend7.length > 0 && (
            <div className="mt-3 flex items-end gap-1">
              {dailyTrend7.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 rounded-t bg-warning/30"
                  style={{
                    height: `${Math.max(4, (d.amount / maxDaily) * 48)}px`,
                  }}
                  title={`${d.date}: Le ${formatCurrency(d.amount)}`}
                />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl bg-surface-card p-6"
        >
          <p className="text-sm text-muted">Week over week</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted">This week</p>
              <p className="font-semibold text-warning">
                Le {formatCurrency(thisWeek)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Last week</p>
              <p className="font-semibold text-muted">
                Le {formatCurrency(lastWeek)}
              </p>
            </div>
          </div>
          {lastWeek > 0 && (
            <p className="mt-2 text-xs text-muted">
              {thisWeek <= lastWeek
                ? `Down ${formatCurrency(lastWeek - thisWeek)} vs last week`
                : `Up ${formatCurrency(thisWeek - lastWeek)} vs last week`}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-2xl bg-surface-card p-6"
        >
          <p className="text-sm text-muted">Projected end of month</p>
          <p className={`mt-1 text-2xl font-bold ${projectedEOM >= 0 ? "text-success" : "text-warning"}`}>
            Le {formatCurrency(projectedEOM)}
          </p>
          <p className="mt-1 text-xs text-muted">
            At current burn rate (Le {formatCurrency(burnRate)}/day), {daysRemaining} days left
          </p>
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-surface-card p-6"
        >
          <p className="text-sm text-muted">Monthly summary</p>
          <p className="mt-1 text-xs text-muted">{monthName}</p>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-background/50 p-3 text-xs text-muted">
            {shareSummary}
          </pre>
          <button
            type="button"
            onClick={handleCopySummary}
            className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent/90"
          >
            {shareCopied ? "Copied!" : "Copy summary"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
