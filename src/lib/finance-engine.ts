import type { Transaction } from "@/types/database";

export function calculateBurnRate(
  transactions: Transaction[],
  days: number = 7
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = transactions.filter(
    (t) => t.type === "expense" && new Date(t.timestamp) >= cutoff
  );
  const total = recent.reduce((sum, t) => sum + Number(t.amount), 0);
  return days > 0 ? total / days : 0;
}

export type ScoreFactor = "budget_adherence" | "savings_consistency" | "spending_distribution" | "activity";
export interface ScoreBreakdown {
  score: number;
  factors: { id: ScoreFactor; label: string; impact: number; description: string }[];
  recommendation: string | null;
}

export function computeFinancialScore(
  burnRate: number,
  baselineCost: number,
  savingsBalance: number,
  recentTransactionCount: number
): number {
  const { score } = computeFinancialScoreBreakdown(
    burnRate,
    baselineCost,
    savingsBalance,
    recentTransactionCount
  );
  return score;
}

export function computeFinancialScoreBreakdown(
  burnRate: number,
  baselineCost: number,
  savingsBalance: number,
  recentTransactionCount: number
): ScoreBreakdown {
  let score = 50;
  const factors: ScoreBreakdown["factors"] = [];

  if (baselineCost > 0) {
    const ratio = burnRate / baselineCost;
    let budgetImpact = 0;
    let budgetDesc = "";
    if (ratio <= 0.8) {
      budgetImpact = 20;
      budgetDesc = `Spending under budget (${(ratio * 100).toFixed(0)}% of baseline)`;
    } else if (ratio <= 1) {
      budgetImpact = 10;
      budgetDesc = `Spending on track (${(ratio * 100).toFixed(0)}% of baseline)`;
    } else if (ratio <= 1.2) {
      budgetImpact = -10;
      budgetDesc = `Spending over budget (${(ratio * 100).toFixed(0)}% of baseline)`;
    } else {
      budgetImpact = -20;
      budgetDesc = `Spending well over budget (${(ratio * 100).toFixed(0)}% of baseline)`;
    }
    score += budgetImpact;
    factors.push({
      id: "budget_adherence",
      label: "Budget adherence",
      impact: budgetImpact,
      description: budgetDesc,
    });
  }

  const savingsImpact = savingsBalance > 0 ? Math.min(15, Math.floor(savingsBalance / 500)) : 0;
  if (savingsImpact > 0) {
    score += savingsImpact;
    factors.push({
      id: "savings_consistency",
      label: "Savings consistency",
      impact: savingsImpact,
      description: `Le ${savingsBalance.toLocaleString()} in savings (+${savingsImpact} pts)`,
    });
  } else {
    factors.push({
      id: "savings_consistency",
      label: "Savings consistency",
      impact: 0,
      description: "Start saving to boost your score",
    });
  }

  const activityImpact = recentTransactionCount >= 3 ? 5 : 0;
  if (activityImpact > 0) {
    score += activityImpact;
    factors.push({
      id: "activity",
      label: "Activity",
      impact: activityImpact,
      description: `${recentTransactionCount} transactions this week`,
    });
  } else {
    factors.push({
      id: "activity",
      label: "Activity",
      impact: 0,
      description: "Log more transactions to improve tracking",
    });
  }

  factors.push({
    id: "spending_distribution",
    label: "Spending distribution",
    impact: 0,
    description: "See Insights for category breakdown",
  });

  const finalScore = Math.max(0, Math.min(100, score));

  let recommendation: string | null = null;
  if (baselineCost > 0 && burnRate > baselineCost) {
    const reduceBy = Math.ceil(burnRate - baselineCost * 0.8);
    const targetScore = 80;
    if (finalScore < targetScore) {
      recommendation = `Reduce daily spending by Le ${reduceBy} to reach ${targetScore}/100`;
    }
  }
  if (finalScore >= 80 && !recommendation) {
    recommendation = "Keep it up! You're on track.";
  }

  return { score: finalScore, factors, recommendation };
}

export function calculateBalance(
  transactions: Transaction[]
): { total: number; income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.type === "income") income += amt;
    else expense += amt;
  }
  return { total: income - expense, income, expense };
}

export function allocateSavings(
  income: number,
  expense: number,
  allocationPercent: number = 10
): number {
  const net = income - expense;
  return net > 0 ? Math.floor(net * (allocationPercent / 100)) : 0;
}

/** Projected balance at end of current month from current balance and daily burn rate. */
export function getProjectedEndOfMonthBalance(
  currentBalance: number,
  burnRate: number,
  daysRemainingInMonth: number
): number {
  return currentBalance - burnRate * daysRemainingInMonth;
}

/** Spending totals for this week and previous week. */
export function getWeekOverWeekSpending(
  transactions: Transaction[]
): { thisWeek: number; lastWeek: number } {
  const now = new Date();
  const startThisWeek = new Date(now);
  startThisWeek.setDate(now.getDate() - now.getDay());
  startThisWeek.setHours(0, 0, 0, 0);
  const startLastWeek = new Date(startThisWeek);
  startLastWeek.setDate(startLastWeek.getDate() - 7);

  let thisWeek = 0;
  let lastWeek = 0;
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.timestamp);
    const amt = Number(t.amount);
    if (d >= startThisWeek) thisWeek += amt;
    else if (d >= startLastWeek) lastWeek += amt;
  }
  return { thisWeek, lastWeek };
}

/** Daily expense totals for the last N days (for a simple trend). */
export function getDailyExpenseTrend(
  transactions: Transaction[],
  days: number
): { date: string; amount: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  const byDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    byDay[d.toDateString()] = 0;
  }
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.timestamp);
    if (d < cutoff) continue;
    const key = d.toDateString();
    if (byDay[key] !== undefined) byDay[key] += Number(t.amount);
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}
