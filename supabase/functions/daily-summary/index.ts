// Supabase Edge Function: Daily Summary
// Schedule: 9 PM local time (cron: 0 21 * * * or similar)
// Limit: Max 2 notifications per day

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: users } = await supabase
      .from("users")
      .select("id, privy_user_id, baseline_cost");

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { userId: string; message?: string }[] = [];

    for (const user of users) {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("type, amount, timestamp")
        .eq("user_id", user.id)
        .gte("timestamp", new Date(Date.now() - 86400000).toISOString());

      let income = 0;
      let expense = 0;
      for (const t of transactions ?? []) {
        const amt = Number(t.amount);
        if (t.type === "income") income += amt;
        else expense += amt;
      }

      const burnRate = (transactions?.filter((t) => t.type === "expense") ?? [])
        .reduce((s, t) => s + Number(t.amount), 0);
      const baselineCost = Number(user.baseline_cost) || 0;
      const overspending = baselineCost > 0 && burnRate > baselineCost * 1.2;

      let message: string;
      if (overspending) {
        message = "Your spending today is higher than usual. Consider reviewing.";
      } else {
        message = `Today: +Le ${income.toLocaleString()} income, -Le ${expense.toLocaleString()} spent. Keep it up!`;
      }

      results.push({ userId: user.privy_user_id, message });

      // In production: send via push notification / email / SMS
      // For now we just prepare the payload
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
