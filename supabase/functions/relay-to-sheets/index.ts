// Supabase Edge Function — server-side relay to Google Sheets Apps Script webhook.
// Keeps the webhook URL out of the client bundle (never exposed to the browser).
//
// Required secret (set via Supabase Dashboard → Edge Functions → Secrets):
//   GOOGLE_SHEETS_WEBHOOK_URL — the Apps Script doPost URL
//
// Optional secret:
//   ALLOWED_ORIGIN — restrict CORS to a specific domain (e.g. https://your-app.vercel.app)
//                    defaults to "*" if not set (backward-compatible)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const WEBHOOK_URL    = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL") ?? "";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

serve(async (req) => {
  const CORS = {
    "Access-Control-Allow-Origin":  ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });

  // If ALLOWED_ORIGIN is locked down, silently reject unexpected origins
  // without leaking any information about why the request failed.
  if (ALLOWED_ORIGIN !== "*") {
    const origin = req.headers.get("origin") ?? "";
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  if (!WEBHOOK_URL) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400, headers: CORS });
  }

  // Strict allowlist — only forward expected string fields, nothing else.
  const allowed = ["data", "nome", "cognome", "email", "prodotto", "match", "store_id"] as const;
  const safe: Record<string, string> = {};
  if (body && typeof body === "object") {
    for (const key of allowed) {
      const val = (body as Record<string, unknown>)[key];
      if (typeof val === "string") safe[key] = val.slice(0, 500);
    }
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safe),
    });
  } catch {
    // Non-critical — Supabase is the source of truth
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
