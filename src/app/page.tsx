"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready) {
      if (authenticated) {
        router.replace("/dashboard");
      }
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-card" />
        <p className="mt-4 text-sm text-muted">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <h1 className="text-center text-3xl font-bold tracking-tight">Kurpur</h1>
      <p className="mt-2 text-center text-muted">
        Your daily financial companion
      </p>
      <p className="mt-1 text-center text-sm text-muted">
        Simple. Premium. Essential.
      </p>
      <button
        onClick={login}
        className="mt-10 rounded-2xl bg-accent px-8 py-3.5 text-base font-medium text-background transition-transform active:scale-[0.97]"
      >
        Get Started
      </button>
    </main>
  );
}
