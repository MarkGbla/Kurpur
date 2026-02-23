"use client";

import { useMemo } from "react";
import {
  calculateBalance,
  calculateBurnRate,
  computeFinancialScore,
} from "@/lib/finance-engine";
import type { Transaction } from "@/types/database";

interface UseFinancialScoreParams {
  transactions: Transaction[];
  baselineCost: number;
  savingsBalance: number;
}

export function useFinancialScore({
  transactions,
  baselineCost,
  savingsBalance,
}: UseFinancialScoreParams) {
  return useMemo(() => {
    const { total, income, expense } = calculateBalance(transactions);
    const burnRate = calculateBurnRate(transactions, 7);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = transactions.filter(
      (t) => new Date(t.timestamp) >= weekAgo
    ).length;
    const score = computeFinancialScore(
      burnRate,
      baselineCost,
      savingsBalance,
      recentCount
    );
    return { total, income, expense, burnRate, score };
  }, [transactions, baselineCost, savingsBalance]);
}
