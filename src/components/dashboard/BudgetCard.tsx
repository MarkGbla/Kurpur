"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Wallet, ChevronRight } from "lucide-react";

interface BudgetCardProps {
  /** Monthly budget in Le. When 0, show CTA to set budget. */
  baselineCost: number;
  /** Daily burn rate (7-day). Used when baselineCost > 0 to show on-track status. */
  burnRate: number;
  isLoading?: boolean;
}

/** Approximate daily budget from monthly (month = 30 days). */
function dailyBudgetFromMonthly(monthly: number): number {
  return monthly > 0 ? monthly / 30 : 0;
}

export function BudgetCard({
  baselineCost,
  burnRate,
  isLoading,
}: BudgetCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-surface-card p-4"
      >
        <div className="h-5 w-32 animate-pulse rounded bg-muted/20" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted/20" />
      </motion.div>
    );
  }

  if (baselineCost <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-surface-card p-4"
      >
        <p className="text-sm font-medium text-muted">Monthly budget</p>
        <p className="mt-1 text-xs text-muted">
          Set your monthly budget in Profile to see if you&apos;re on track.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          Set budget in Profile
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </motion.div>
    );
  }

  const dailyBudget = dailyBudgetFromMonthly(baselineCost);
  const ratio = dailyBudget > 0 ? burnRate / dailyBudget : 0;
  const onTrack = ratio <= 1;
  const statusText =
    ratio <= 0.8
      ? "Under budget"
      : ratio <= 1
        ? "On track"
        : "Over budget";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-surface-card p-4"
    >
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-muted" strokeWidth={1.5} />
        <p className="text-sm font-medium text-muted">Monthly budget</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">
        Le {formatCurrency(baselineCost)}
      </p>
      <p className="mt-1 text-xs text-muted">
        Le {formatCurrency(burnRate)}/day burn
        {dailyBudget > 0 && (
          <span
            className={
              onTrack ? "text-success" : "text-warning"
            }
          >
            {" "}
            · {statusText}
          </span>
        )}
      </p>
    </motion.div>
  );
}
