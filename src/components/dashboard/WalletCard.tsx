"use client";

import { motion } from "framer-motion";
import { formatCurrencyWithDecimals } from "@/lib/utils";
import { Plus } from "lucide-react";

interface WalletCardProps {
  balance: number;
  isLoading?: boolean;
  /** Optional: last 4 digits for card display (e.g. from user id). */
  accountLast4?: string;
  /** Optional: show small add button on card (primary action is now FAB). */
  onAddClick?: () => void;
}

export function WalletCard({
  balance,
  isLoading,
  accountLast4 = "****",
  onAddClick,
}: WalletCardProps) {
  const last4 = accountLast4 !== "****" && accountLast4.length >= 4 ? accountLast4.slice(-4) : "****";
  const maskedAccount = "** " + last4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-[#1a1a1a] p-6 shadow-lg"
    >
      {/* Top row: Wallet title (primary add action is FAB) */}
      <div className="relative flex items-center justify-between">
        <h2 className="text-base font-medium text-white">Wallet</h2>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a2a] text-white transition-opacity hover:opacity-90 active:opacity-80"
            aria-label="Quick add transaction"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Balance — no user name */}
      {isLoading ? (
        <div className="relative mt-4 h-12 w-40 animate-pulse rounded-lg bg-white/10" />
      ) : (
        <p className="relative mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Le {formatCurrencyWithDecimals(balance)}
        </p>
      )}

      {/* Bottom row: Account number + card visual */}
      <div className="relative mt-4 flex items-center justify-between">
        <p className="text-sm text-[#8a8a8a]">Account {maskedAccount}</p>
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-14 rounded-md bg-gradient-to-br from-red-500/90 to-amber-500/90 shadow"
            aria-hidden
          />
          <p className="text-sm text-[#8a8a8a]">{last4 === "****" ? "****" : `****${last4}`}</p>
        </div>
      </div>
    </motion.div>
  );
}
