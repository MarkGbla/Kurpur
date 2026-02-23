"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SpendingOverviewProps {
  income: number;
  expense: number;
  burnRate: number;
  isLoading?: boolean;
}

export function SpendingOverview({
  income,
  expense,
  burnRate,
  isLoading,
}: SpendingOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05, ease: "easeOut" }}
      className="rounded-2xl bg-surface-card p-4"
    >
      <p className="text-sm font-medium text-muted">Spending Summary</p>
      {isLoading ? (
        <div className="mt-3 space-y-2">
          <div className="h-8 w-full animate-pulse rounded-lg bg-muted/20" />
          <div className="h-8 w-full animate-pulse rounded-lg bg-muted/20" />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3">
            <TrendingUp className="h-5 w-5 text-success" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-muted">Income</p>
              <p className="font-semibold text-success">
                Le {formatCurrency(income)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-warning/10 p-3">
            <TrendingDown className="h-5 w-5 text-warning" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-muted">Expense</p>
              <p className="font-semibold text-warning">
                Le {formatCurrency(expense)}
              </p>
            </div>
          </div>
        </div>
      )}
      {!isLoading && burnRate > 0 && (
        <p className="mt-2 text-xs text-muted">
          Daily burn rate: Le {formatCurrency(burnRate)}/day
        </p>
      )}
    </motion.div>
  );
}
