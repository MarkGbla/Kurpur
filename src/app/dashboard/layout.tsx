"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Home, Activity, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/insights", label: "Insights", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, logout } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/");
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-card" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <main className="flex-1">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-muted/20 bg-background/95 backdrop-blur">
        <div className="flex justify-around px-2 py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors",
                pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                  ? "text-accent"
                  : "text-muted"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={1.5} />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
