import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyWithDecimals(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Derive a cardholder-style display name from email (e.g. "john.doe@mail.com" → "JOHN DOE"). */
export function displayNameFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "CARDHOLDER";
  const local = email.split("@")[0].trim();
  if (!local) return "CARDHOLDER";
  const name = local.replace(/[._-]+/g, " ").trim();
  return name.toUpperCase().slice(0, 24) || "CARDHOLDER";
}
