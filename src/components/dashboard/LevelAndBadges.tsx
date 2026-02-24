"use client";

import { motion } from "framer-motion";
import { Award, Flame, Target, Sun } from "lucide-react";
import { getLevelFromScore, calculateUsageStreak, hasNoSpendDayRecently } from "@/lib/engagement";
import type { Transaction } from "@/types/database";

interface LevelAndBadgesProps {
  financialScore: number;
  transactions: Transaction[];
  savingsGoalReached: boolean;
}

export function LevelAndBadges({
  financialScore,
  transactions,
  savingsGoalReached,
}: LevelAndBadgesProps) {
  const level = getLevelFromScore(financialScore);
  const streak = calculateUsageStreak(transactions.map((t) => t.timestamp));
  const noSpendDay = hasNoSpendDayRecently(
    transactions.map((t) => ({
      date: new Date(t.timestamp).toDateString(),
      type: t.type,
    }))
  );

  const badges: { id: string; label: string; icon: typeof Flame; earned: boolean }[] = [
    { id: "streak", label: "7-day streak", icon: Flame, earned: streak >= 7 },
    { id: "savings", label: "First savings goal", icon: Target, earned: savingsGoalReached },
    { id: "nospend", label: "No-spend day", icon: Sun, earned: noSpendDay },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;
  if (level <= 1 && earnedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-surface-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
          <Award className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium">Level {level}</p>
          <p className="text-xs text-muted">Based on your financial score</p>
        </div>
      </div>
      {badges.some((b) => b.earned) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.id}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                b.earned ? "bg-success/20 text-success" : "bg-muted/20 text-muted"
              }`}
              title={b.earned ? b.label : `Earn: ${b.label}`}
            >
              <b.icon className="h-3.5 w-3.5" />
              {b.label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
