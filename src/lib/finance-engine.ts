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

export function computeFinancialScore(
  burnRate: number,
  baselineCost: number,
  savingsBalance: number,
  recentTransactionCount: number
): number {
  let score = 50;
  if (baselineCost > 0) {
    const ratio = burnRate / baselineCost;
    if (ratio <= 0.8) score += 20;
    else if (ratio <= 1) score += 10;
    else if (ratio <= 1.2) score -= 10;
    else score -= 20;
  }
  if (savingsBalance > 0) score += Math.min(15, Math.floor(savingsBalance / 500));
  if (recentTransactionCount >= 3) score += 5;
  return Math.max(0, Math.min(100, score));
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
