"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { InstallPrompt } from "@/components/InstallPrompt";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  if (!privyAppId || privyAppId === "placeholder") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <p className="text-center text-muted">
          Privy is not configured. Add <code className="rounded bg-surface-card px-1.5 py-0.5">NEXT_PUBLIC_PRIVY_APP_ID</code> to your{" "}
          <code className="rounded bg-surface-card px-1.5 py-0.5">.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#FFFFFF",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
      <InstallPrompt />
    </PrivyProvider>
  );
}
