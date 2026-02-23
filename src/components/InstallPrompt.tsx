"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const STORAGE_KEY = "kurpur_install_prompt";

type InstallPromptStatus = "dismissed" | "installed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function getStoredStatus(): InstallPromptStatus | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "dismissed" || v === "installed") return v;
  return null;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<{ outcome: string }>;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isStandalone() || getStoredStatus() !== null) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [mounted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      const result = await deferredPrompt.prompt();
      if (result.outcome === "accepted") {
        localStorage.setItem(STORAGE_KEY, "installed");
        setOpen(false);
      }
    } catch {
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setOpen(false);
  };

  if (!mounted || !open || !deferredPrompt) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/20 bg-surface p-5 shadow-xl outline-none">
          <h2 className="text-lg font-semibold">Install Kurpur</h2>
          <p className="mt-1.5 text-sm text-muted">
            Add the app to your home screen for quick access and a better experience.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={handleInstall} className="w-full gap-2">
              <Download className="h-5 w-5" strokeWidth={1.5} />
              Install app
            </Button>
            <Button variant="ghost" onClick={handleDismiss} className="w-full text-muted">
              Not now
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
