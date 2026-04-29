// Edge Function — wraps verify_staff_pin RPC to capture the real client IP.
// Calling the RPC directly from the browser loses the IP; routing through here
// lets the SQL function enforce IP-based lockout that localStorage clearing cannot bypass.
//
// Required secrets (auto-injected by Supabase runtime):
//   SUPABASE_URL              — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected
// Optional secrets:
//   ALLOWED_ORIGIN — lock CORS to a specific domain (e.g. https://your-app.vercel.app)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGIN  = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const SILENT = JSON.stringify({ valid: false, locked_seconds: 0 });

function headers(origin: string) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin":  ALLOWED_ORIGIN === "*" ? "*" : origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headers(origin) });
  }

  // Silent CORS rejection — returns 200 with invalid result so origin can't be enumerated
  if (ALLOWED_ORIGIN !== "*" && origin && origin !== ALLOWED_ORIGIN) {
    return new Response(SILENT, { status: 200, headers: headers(origin) });
  }

  if (req.method !== "POST") {
    return new Response(SILENT, { status: 200, headers: headers(origin) });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(SILENT, { status: 200, headers: headers(origin) });
  }

  // Real IP — Supabase injects x-forwarded-for; take the first (leftmost) address.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data, error } = await supabase.rpc("verify_staff_pin", {
    pin_input:  String(body.pin_input  ?? ""),
    client_id:  String(body.client_id  ?? "default"),
    user_agent: String(body.user_agent ?? ""),
    ip_address: ip,
  });

  if (error) {
    console.error("[verify-pin] rpc error:", error.message);
    return new Response(SILENT, { status: 200, headers: headers(origin) });
  }

  return new Response(JSON.stringify(data), { status: 200, headers: headers(origin) });
});
