"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";

const STORAGE_KEY = "kurpur_install_prompt";

type InstallPromptStatus = "dismissed" | "installed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/** iOS Safari does not fire beforeinstallprompt; we show custom "Add to Home Screen" instructions. */
function isIOS(): boolean {
  if (typeof window === "undefined" || !window.navigator) return false;
  const ua = window.navigator.userAgent;
  const platform = (window.navigator as { platform?: string }).platform ?? "";
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1)
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
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isStandalone() || getStoredStatus() !== null) {
      return;
    }

    // iOS: show custom "Add to Home Screen" prompt (beforeinstallprompt never fires on iOS)
    if (isIOS()) {
      const t = setTimeout(() => {
        setIosMode(true);
        setOpen(true);
      }, 1500);
      return () => clearTimeout(t);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      setIosMode(false);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [mounted]);

  const handleInstall = async () => {
    if (iosMode) {
      handleDismiss();
      return;
    }
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

  const showPrompt = mounted && open && (deferredPrompt !== null || iosMode);
  if (!showPrompt) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[min(85vh,calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-muted/20 bg-surface p-5 shadow-xl outline-none"
          aria-describedby={undefined}
        >
          <div className="pb-[env(safe-area-inset-bottom)]">
            <h2 className="text-lg font-semibold">Install Kurpur</h2>
            {iosMode ? (
              <>
                <p className="mt-1.5 text-sm text-muted">
                  Add Kurpur to your home screen for quick access and a better experience.
                </p>
                <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-muted">
                  <li>Tap the <Share className="inline h-4 w-4 -mt-0.5" strokeWidth={1.5} aria-hidden /> Share button (bottom in Safari).</li>
                  <li>Scroll and tap &ldquo;Add to Home Screen&rdquo;.</li>
                  <li>Tap &ldquo;Add&rdquo; in the top right.</li>
                </ol>
              </>
            ) : (
              <p className="mt-1.5 text-sm text-muted">
                Add the app to your home screen for quick access and a better experience.
              </p>
            )}
            <div className="mt-5 flex min-h-[44px] flex-col gap-2">
              <Button
                onClick={handleInstall}
                className="min-h-[44px] w-full gap-2 touch-manipulation"
              >
                {iosMode ? (
                  "Got it"
                ) : (
                  <>
                    <Download className="h-5 w-5" strokeWidth={1.5} />
                    Install app
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="min-h-[44px] w-full touch-manipulation text-muted"
              >
                Not now
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
