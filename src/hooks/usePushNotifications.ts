"use client";

import { useState, useCallback, useEffect } from "react";

export type PushStatus =
  | "unsupported"
  | "unavailable"
  | "prompt"
  | "subscribed"
  | "denied"
  | "error"
  | "loading";

type UsePushOptions = {
  getAccessToken?: () => Promise<string | null>;
};

const SW_READY_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export function usePushNotifications(options: UsePushOptions = {}) {
  const { getAccessToken } = options;
  const [status, setStatus] = useState<PushStatus>("loading");
  const [message, setMessage] = useState<string | null>(null);

  const checkSupport = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) {
      setStatus("unsupported");
      setMessage("Push notifications are not supported in this browser.");
      return false;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("Permission denied.");
        return false;
      }

      const reg = await withTimeout(
        navigator.serviceWorker.ready,
        SW_READY_TIMEOUT_MS
      );
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus("subscribed");
        setMessage("Notifications are already enabled.");
        return true;
      }

      const keyRes = await fetch("/api/push/vapid-public-key");
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.publicKey) {
        setStatus("error");
        setMessage(keyData.error ?? "Server not configured for push.");
        return false;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
      });

      const token = getAccessToken ? await getAccessToken().catch(() => null) : null;
      const subscribeRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey("p256dh")!)))),
              auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey("auth")!)))),
            },
          },
        }),
      });

      if (!subscribeRes.ok) {
        const err = await subscribeRes.json().catch(() => ({}));
        setStatus("error");
        setMessage(err.error ?? "Failed to save subscription.");
        return false;
      }

      setStatus("subscribed");
      setMessage("Notifications enabled.");
      return true;
    } catch (e) {
      const isTimeout = e instanceof Error && e.message === "timeout";
      setStatus(isTimeout ? "unavailable" : "error");
      setMessage(
        isTimeout
          ? "Service worker not ready. Build for production and install the app (PWA) to enable push."
          : e instanceof Error
            ? e.message
            : "Something went wrong."
      );
      return false;
    }
  }, [checkSupport, getAccessToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!checkSupport()) {
      setStatus("unsupported");
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const reg = await withTimeout(
          navigator.serviceWorker.ready,
          SW_READY_TIMEOUT_MS
        );
        if (cancelled) return;
        const sub = await reg.pushManager.getSubscription();
        if (sub) setStatus("subscribed");
        else if (Notification.permission === "denied") setStatus("denied");
        else setStatus("prompt");
      } catch {
        if (cancelled) return;
        setStatus("unavailable");
        setMessage(
          "Push requires the installed app (PWA). Run a production build and install from the browser."
        );
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [checkSupport]);

  return { status, message, subscribe, supported: checkSupport() };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
