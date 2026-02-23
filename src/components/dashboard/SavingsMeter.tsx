"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { PiggyBank } from "lucide-react";

interface SavingsMeterProps {
  virtualBalance: number;
  target?: number;
  isLoading?: boolean;
}

export function SavingsMeter({
  virtualBalance,
  target = 1000,
  isLoading,
}: SavingsMeterProps) {
  const progress = Math.min(100, (virtualBalance / target) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
      className="rounded-2xl bg-surface-card p-4"
    >
      <div className="flex items-center gap-2">
        <PiggyBank className="h-5 w-5 text-success" strokeWidth={1.5} />
        <p className="text-sm font-medium text-muted">Savings</p>
      </div>
      {isLoading ? (
        <div className="mt-2 h-6 w-3/4 animate-pulse rounded-full bg-muted/20" />
      ) : (
        <>
          <p className="mt-2 text-lg font-semibold text-success">
            Le {formatCurrency(virtualBalance)}
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
        </>
      )}
    </motion.div>
  );
}
