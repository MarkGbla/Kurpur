"use client";

import { motion } from "framer-motion";
import {
  getPositiveReinforcementMessage,
  detectSavingsMilestone,
  calculateUsageStreak,
} from "@/lib/engagement";
import {
  calculateBalance,
  calculateBurnRate,
} from "@/lib/finance-engine";
import type { Transaction } from "@/types/database";

interface EngagementBannerProps {
  transactions: Transaction[];
  baselineCost: number;
  savingsBalance: number;
  previousSavingsBalance?: number;
  financialScore: number;
  isLoading?: boolean;
}

export function EngagementBanner({
  transactions,
  baselineCost,
  savingsBalance,
  previousSavingsBalance = 0,
  financialScore,
  isLoading,
}: EngagementBannerProps) {
  if (isLoading || transactions.length === 0) return null;

  const { income, expense } = calculateBalance(transactions);
  const burnRate = calculateBurnRate(transactions, 7);
  const burnVsBaseline = baselineCost > 0 ? burnRate / baselineCost : 0;
  const savingsGrowth = savingsBalance - previousSavingsBalance;
  const streak = calculateUsageStreak(
    transactions.map((t) => t.timestamp)
  );

  const milestone = detectSavingsMilestone(
    savingsBalance,
    previousSavingsBalance
  );
  const message = milestone
    ? milestone.message
    : getPositiveReinforcementMessage(
        financialScore,
        burnVsBaseline,
        savingsGrowth,
        streak
      );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-surface-card p-4"
    >
      <p className="text-sm text-muted">Today&apos;s insight</p>
      <p className="mt-1 font-medium text-accent">{message}</p>
      {streak >= 1 && (
        <p className="mt-2 text-xs text-success">
          {streak} day{streak !== 1 ? "s" : ""} streak
        </p>
      )}
    </motion.div>
  );
}
