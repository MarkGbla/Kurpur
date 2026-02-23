import { NextRequest } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";

let privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error(
        "Privy server auth requires NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET in environment."
      );
    }
    privyClient = new PrivyClient(appId, appSecret);
  }
  return privyClient;
}

/**
 * Verifies the Privy access token from the request (Authorization: Bearer <token>)
 * and returns the authenticated user's Privy user ID. Returns null if missing or invalid.
 * Use this so Neon data is always scoped to the verified Privy user (Privy ↔ Neon link).
 */
export async function getVerifiedPrivyUserId(
  request: NextRequest
): Promise<string | null> {
  try {
    const auth = request.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return null;

    const client = getPrivyClient();
    const claims = await client.verifyAuthToken(token);
    return claims?.userId ?? null;
  } catch {
    return null;
  }
}
