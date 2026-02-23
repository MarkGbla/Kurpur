/**
 * Simple in-memory rate limiter for API routes.
 * For production, use Redis or Vercel KV.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute per IP

export function rateLimit(identifier: string): { success: boolean } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true };
  }

  if (now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true };
  }

  entry.count++;
  return { success: entry.count <= MAX_REQUESTS };
}

export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}
