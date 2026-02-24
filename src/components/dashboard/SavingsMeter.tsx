"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SavingsMeterProps {
  virtualBalance: number;
  target?: number;
  isLoading?: boolean;
  /** Daily savings rate for projected completion (optional). */
  dailySavingsRate?: number;
  onSaveNow?: () => void;
}

function getProjectedDate(balance: number, target: number, dailyRate: number): string | null {
  if (dailyRate <= 0 || balance >= target) return null;
  const remaining = target - balance;
  const days = Math.ceil(remaining / dailyRate);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function SavingsMeter({
  virtualBalance,
  target = 1000,
  isLoading,
  dailySavingsRate = 0,
  onSaveNow,
}: SavingsMeterProps) {
  const progress = target > 0 ? Math.min(100, (virtualBalance / target) * 100) : 0;
  const projectedDate = getProjectedDate(virtualBalance, target, dailySavingsRate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
      className="rounded-2xl bg-surface-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-success" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted">Savings</p>
        </div>
        {onSaveNow && !isLoading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveNow}
            className="rounded-full border-success/40 text-success hover:bg-success/10"
          >
            Save Now
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="mt-2 h-6 w-3/4 animate-pulse rounded-full bg-muted/20" />
      ) : (
        <>
          <p className="mt-2 text-lg font-semibold text-success">
            Le {formatCurrency(virtualBalance)}
          </p>
          <p className="text-xs text-muted">
            {progress.toFixed(0)}% of Le {formatCurrency(target)}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full rounded-full bg-success"
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Target: Le {formatCurrency(target)}
          </p>
          {projectedDate && (
            <p className="mt-0.5 text-xs text-success">
              On track by ~{projectedDate}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
