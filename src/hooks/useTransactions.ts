"use client";

import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "@/types/database";

export function useTransactions(privyUserId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!privyUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions?userId=${privyUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setTransactions(data.transactions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [privyUserId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { transactions, isLoading, error, refetch };
}
