"use client";

import { motion } from "framer-motion";
import { formatCurrencyWithDecimals, displayNameFromEmail } from "@/lib/utils";
import { Plus } from "lucide-react";
import Image from "next/image";

interface WalletCardProps {
  balance: number;
  isLoading?: boolean;
  /** User email; used to show cardholder name on the card. */
  userEmail?: string | null;
  /** Optional: show small add button on card (primary action is now FAB). */
  onAddClick?: () => void;
}

export function WalletCard({
  balance,
  isLoading,
  userEmail,
  onAddClick,
}: WalletCardProps) {
  const cardholderName = displayNameFromEmail(userEmail);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[1.25rem] bg-[#0d0d0d] shadow-xl"
    >
      {/* Decorative curved lines (Kurpur brand pattern) */}
      <div className="absolute inset-0 overflow-hidden rounded-[1.25rem]" aria-hidden>
        <svg
          className="absolute -right-12 -top-8 h-[280px] w-[280px] opacity-90"
          viewBox="0 0 200 200"
          fill="none"
        >
          <defs>
            <linearGradient id="kurpur-lines" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.35" />
              <stop offset="50%" stopColor="rgb(148 163 184)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(255 255 255)" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          {Array.from({ length: 28 }).map((_, i) => (
            <path
              key={i}
              d={`M ${20 + i * 1.5} 20 Q 120 ${60 + i * 3} 180 ${120 + i * 2}`}
              stroke="url(#kurpur-lines)"
              strokeWidth="0.8"
              fill="none"
            />
          ))}
        </svg>
      </div>

      <div className="relative flex flex-col p-6">
        {/* Top row: Kurpur logo + optional add */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40">
              <Image
                src="/logo.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain opacity-95"
                aria-hidden
              />
            </div>
            <span className="text-sm font-medium tracking-wide text-white/95">Kurpur</span>
          </div>
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-opacity hover:bg-white/20 active:opacity-80"
              aria-label="Quick add transaction"
            >
              <Plus className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* EMV chip + contactless */}
        <div className="mt-6 flex items-center gap-4">
          <div
            className="flex h-10 w-14 items-center justify-center rounded-[6px] bg-gradient-to-br from-[#a8a8a8] via-[#787878] to-[#505050] shadow-md"
            aria-hidden
          >
            <div className="grid grid-cols-4 grid-rows-3 gap-0.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-1.5 w-2 rounded-sm bg-[#3a3a3a]" />
              ))}
            </div>
          </div>
          <svg
            className="h-7 w-7 text-white/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M8 8 A4 4 0 0 1 8 16" />
            <path d="M6 6 A6 6 0 0 1 6 18" />
            <path d="M4 4 A8 8 0 0 1 4 20" />
            <path d="M2 2 A10 10 0 0 1 2 22" />
          </svg>
        </div>

        {/* Balance */}
        {isLoading ? (
          <div className="mt-5 h-11 w-44 animate-pulse rounded-lg bg-white/10" />
        ) : (
          <p className="mt-5 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Le {formatCurrencyWithDecimals(balance)}
          </p>
        )}

        {/* Cardholder name (from email) */}
        <p className="mt-4 text-sm font-medium tracking-[0.2em] text-white/80">
          {cardholderName}
        </p>
      </div>
    </motion.div>
  );
}
