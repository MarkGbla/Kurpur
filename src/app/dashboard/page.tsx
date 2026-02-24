"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { SpendingOverview } from "@/components/dashboard/SpendingOverview";
import { SavingsMeter } from "@/components/dashboard/SavingsMeter";
import { EngagementBanner } from "@/components/dashboard/EngagementBanner";
import { AddTransactionSheet } from "@/components/dashboard/AddTransactionSheet";
import { AddTransactionFAB } from "@/components/dashboard/AddTransactionFAB";
import { SaveNowSheet } from "@/components/dashboard/SaveNowSheet";
import { LevelAndBadges } from "@/components/dashboard/LevelAndBadges";
import {
  calculateBalance,
  calculateBurnRate,
  allocateSavings,
  computeFinancialScore,
} from "@/lib/finance-engine";
import type { Transaction } from "@/types/database";

interface UserData {
  id: string;
  privyUserId: string;
  baselineCost: number;
  savingsBalance: number;
  savingsTarget: number;
}

export default function DashboardPage() {
  const { user, authenticated, getAccessToken } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [addSheetInitialType, setAddSheetInitialType] = useState<"income" | "expense">("expense");
  const [saveSheetInitialAmount, setSaveSheetInitialAmount] = useState(0);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const token = await getAccessToken?.().catch(() => null);
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          privyUserId: user.id,
          email: user.email?.address ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load dashboard");

      setTransactions(data.transactions ?? []);
      if (data.user) {
        setUserData({
          id: data.user.id,
          privyUserId: user.id,
          baselineCost: data.user.baseline_cost ?? 0,
          savingsBalance: data.savings?.virtualBalance ?? 0,
          savingsTarget: data.savings?.batchThreshold ?? 1000,
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email?.address, getAccessToken]);

  useEffect(() => {
    if (authenticated && user?.id) {
      fetchData();
    }
  }, [authenticated, user?.id, fetchData]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      setEditTransactionId(editId);
      setSheetOpen(true);
    }
  }, [searchParams]);

  const handleTransactionAdded = useCallback(() => {
    setSheetOpen(false);
    fetchData();
  }, [fetchData]);

  const openAddExpense = useCallback(() => {
    setAddSheetInitialType("expense");
    setSheetOpen(true);
  }, []);
  const openAddIncome = useCallback(() => {
    setAddSheetInitialType("income");
    setSheetOpen(true);
  }, []);
  const openSaveNow = useCallback((prefillAmount?: number) => {
    setSaveSheetInitialAmount(prefillAmount ?? 0);
    setSaveSheetOpen(true);
  }, []);
  const handleSaveSuccess = useCallback(() => {
    setSaveSheetOpen(false);
    fetchData();
  }, [fetchData]);

  const { total, income, expense } = calculateBalance(transactions);
  const burnRate = calculateBurnRate(transactions, 7);
  const suggestedSavings = allocateSavings(income, expense);
  const categoryTotals = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
      return acc;
    }, {});
  const financialScore = computeFinancialScore(
    burnRate,
    userData?.baselineCost ?? 0,
    userData?.savingsBalance ?? 0,
    transactions.filter((t) => {
      const d = new Date(t.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length
  );

  const greeting =
    new Date().getHours() < 12 ? "Good morning" : "Good afternoon";

  return (
    <div className="min-h-screen bg-background px-4 pb-6 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
        <p className="mt-0.5 text-sm text-muted">Welcome to Kurpur</p>
      </header>

      <section className="space-y-4">
        <WalletCard
          balance={total}
          isLoading={isLoading}
          accountLast4={userData?.id?.slice(-4) ?? "****"}
          onAddClick={() => setSheetOpen(true)}
        />
        <SpendingOverview
          income={income}
          expense={expense}
          burnRate={burnRate}
          isLoading={isLoading}
          categoryTotals={categoryTotals}
        />
        <SavingsMeter
          virtualBalance={userData?.savingsBalance ?? 0}
          target={userData?.savingsTarget ?? 1000}
          isLoading={isLoading}
          dailySavingsRate={suggestedSavings > 0 ? suggestedSavings : 0}
          onSaveNow={() => openSaveNow()}
        />

        {!isLoading && suggestedSavings > 0 && (
          <button
            type="button"
            onClick={() => openSaveNow(suggestedSavings)}
            className="w-full rounded-xl bg-success/10 py-3 text-center text-sm font-medium text-success transition-colors hover:bg-success/20 active:bg-success/25"
          >
            You could save Le {suggestedSavings} today — tap to pre-fill
          </button>
        )}

        {!isLoading && (
          <EngagementBanner
            transactions={transactions}
            baselineCost={userData?.baselineCost ?? 0}
            savingsBalance={userData?.savingsBalance ?? 0}
            financialScore={financialScore}
          />
        )}
        {!isLoading && (
          <LevelAndBadges
            financialScore={financialScore}
            transactions={transactions}
            savingsGoalReached={(userData?.savingsBalance ?? 0) >= (userData?.savingsTarget ?? 1000)}
          />
        )}
      </section>


      <AddTransactionSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditTransactionId(null);
        }}
        privyUserId={user?.id ?? ""}
        onSuccess={handleTransactionAdded}
        initialType={addSheetInitialType}
        editTransactionId={editTransactionId}
      />
      <SaveNowSheet
        open={saveSheetOpen}
        onOpenChange={setSaveSheetOpen}
        privyUserId={user?.id ?? ""}
        initialAmount={saveSheetInitialAmount}
        onSuccess={handleSaveSuccess}
      />
      <AddTransactionFAB
        onAddExpense={openAddExpense}
        onAddIncome={openAddIncome}
        onAddSavings={() => openSaveNow()}
      />
    </div>
  );
}
