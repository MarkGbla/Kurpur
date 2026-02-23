"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, useCallback } from "react";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { SpendingOverview } from "@/components/dashboard/SpendingOverview";
import { SavingsMeter } from "@/components/dashboard/SavingsMeter";
import { EngagementBanner } from "@/components/dashboard/EngagementBanner";
import { AddTransactionSheet } from "@/components/dashboard/AddTransactionSheet";
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

  const handleTransactionAdded = useCallback(() => {
    setSheetOpen(false);
    fetchData();
  }, [fetchData]);

  const { total, income, expense } = calculateBalance(transactions);
  const burnRate = calculateBurnRate(transactions, 7);
  const suggestedSavings = allocateSavings(income, expense);
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
        />
        <SavingsMeter
          virtualBalance={userData?.savingsBalance ?? 0}
          target={userData?.savingsTarget ?? 1000}
          isLoading={isLoading}
        />

        {!isLoading && suggestedSavings > 0 && (
          <p className="text-center text-sm text-success">
            You could save Le {suggestedSavings} today
          </p>
        )}

        {!isLoading && (
          <EngagementBanner
            transactions={transactions}
            baselineCost={userData?.baselineCost ?? 0}
            savingsBalance={userData?.savingsBalance ?? 0}
            financialScore={financialScore}
          />
        )}
      </section>


      <AddTransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        privyUserId={user?.id ?? ""}
        onSuccess={handleTransactionAdded}
      />
    </div>
  );
}
