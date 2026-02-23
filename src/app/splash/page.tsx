"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/"), 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-3xl font-bold tracking-tight text-accent">Kurpur</h1>
      <p className="mt-2 text-sm text-muted">Your daily financial companion</p>
      <div className="mt-8 h-1 w-24 animate-pulse rounded-full bg-surface-card" />
    </div>
  );
}
