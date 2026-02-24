"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

const FAB_TOOLTIP_KEY = "kurpur_fab_tooltip_seen";

interface AddTransactionFABProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddSavings: () => void;
  className?: string;
}

export function AddTransactionFAB({
  onAddExpense,
  onAddIncome,
  onAddSavings,
  className,
}: AddTransactionFABProps) {
  const [open, setOpen] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(FAB_TOOLTIP_KEY);
    if (!seen) {
      const t = setTimeout(() => setShowTooltip(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleOpen = () => {
    setOpen(true);
    if (showTooltip) {
      setShowTooltip(false);
      try {
        localStorage.setItem(FAB_TOOLTIP_KEY, "1");
      } catch {}
    }
  };

  const handleAction = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <div className={cn("fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2", className)}>
        <AnimatePresence>
          {showTooltip && !open && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="rounded-lg bg-surface-card px-3 py-2 text-xs text-muted shadow-lg ring-1 ring-muted/20"
            >
              Tap to add a transaction
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-background shadow-lg transition-transform active:scale-95"
          aria-label="Add transaction"
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
          <span className="text-sm font-semibold">Add Transaction</span>
        </motion.button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-muted/20 bg-surface outline-none">
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted/40" />
            </div>
            <p className="px-4 pb-2 text-sm text-muted">Quick add</p>
            <div className="grid grid-cols-1 gap-2 px-4 pb-8">
              <button
                type="button"
                onClick={() => handleAction(onAddExpense)}
                className="flex items-center gap-3 rounded-xl bg-warning/15 px-4 py-3 text-left transition-colors hover:bg-warning/25"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/30">
                  <TrendingDown className="h-5 w-5 text-warning" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium">Add Expense</p>
                  <p className="text-xs text-muted">Record money spent</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleAction(onAddIncome)}
                className="flex items-center gap-3 rounded-xl bg-success/15 px-4 py-3 text-left transition-colors hover:bg-success/25"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/30">
                  <TrendingUp className="h-5 w-5 text-success" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium">Add Income</p>
                  <p className="text-xs text-muted">Record money received</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleAction(onAddSavings)}
                className="flex items-center gap-3 rounded-xl bg-surface-card px-4 py-3 text-left transition-colors hover:bg-surface-card/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                  <PiggyBank className="h-5 w-5 text-success" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium">Add Savings</p>
                  <p className="text-xs text-muted">Save to your goal</p>
                </div>
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
