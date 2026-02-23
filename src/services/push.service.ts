import { getNeonDb } from "@/lib/neon";
import webpush from "web-push";

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function getVapidKeys(): { publicKey: string; privateKey: string } {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in environment for push notifications."
    );
  }
  return { publicKey, privateKey };
}

export function getVapidPublicKey(): string | null {
  try {
    return getVapidKeys().publicKey;
  } catch {
    return null;
  }
}

export async function saveSubscription(
  privyUserId: string,
  subscription: PushSubscriptionPayload
): Promise<{ error?: string }> {
  const sql = getNeonDb();
  const userRows = (await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `) as { id: string }[];
  const user = userRows[0];
  if (!user) return { error: "User not found" };

  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;
  if (!p256dh || !auth) return { error: "Invalid subscription keys" };

  try {
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${user.id}, ${subscription.endpoint}, ${p256dh}, ${auth})
      ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `;
    return {};
  } catch (e) {
    console.error("Save subscription error:", e);
    return { error: "Failed to save subscription" };
  }
}

export async function getSubscriptionsByPrivyUserId(
  privyUserId: string
): Promise<PushSubscriptionPayload[]> {
  const sql = getNeonDb();
  const userRows = (await sql`
    SELECT id FROM users WHERE privy_user_id = ${privyUserId} LIMIT 1
  `) as { id: string }[];
  const user = userRows[0];
  if (!user) return [];

  const rows = (await sql`
    SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${user.id}
  `) as { endpoint: string; p256dh: string; auth: string }[];
  return rows.map((r) => ({
    endpoint: r.endpoint,
    keys: { p256dh: r.p256dh, auth: r.auth },
  }));
}

export async function sendPushToUser(
  privyUserId: string,
  payload: { title: string; body?: string; url?: string }
): Promise<{ sent: number; error?: string }> {
  try {
    const { publicKey, privateKey } = getVapidKeys();
    webpush.setVapidDetails(
      "mailto:support@kurpur.app",
      publicKey,
      privateKey
    );
  } catch (e) {
    return { sent: 0, error: "Push not configured" };
  }

  const subscriptions = await getSubscriptionsByPrivyUserId(privyUserId);
  if (subscriptions.length === 0) return { sent: 0 };

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body ?? "",
          url: payload.url ?? "/dashboard",
        }),
        { TTL: 86400 }
      );
      sent++;
    } catch (e) {
      console.error("Push send error for endpoint:", sub.endpoint, e);
    }
  }
  return { sent };
}
