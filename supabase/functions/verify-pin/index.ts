// Edge Function — wraps verify_staff_pin RPC to capture the real client IP.
// Calling the RPC directly from the browser loses the IP; routing through here
// lets the SQL function enforce IP-based lockout that localStorage clearing cannot bypass.
//
// Required secrets (auto-injected by Supabase runtime):
//   SUPABASE_URL              — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const HEADERS = { "Content-Type": "application/json" };
const SILENT  = JSON.stringify({ valid: false, locked_seconds: 0 });

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(SILENT, { status: 200, headers: HEADERS });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(SILENT, { status: 200, headers: HEADERS });
  }

  // Real IP — Supabase/Vercel injects x-forwarded-for; take the first (leftmost) address.
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
    return new Response(SILENT, { status: 200, headers: HEADERS });
  }

  return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
});
