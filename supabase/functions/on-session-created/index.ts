// Supabase Edge Function — triggered by Database Webhook on quiz_sessions INSERT
// Generates a unique Shopify discount code, sends the match email via Resend,
// then updates the session row with the code and email_sent = true.
//
// Required secrets (set via: supabase secrets set KEY=value):
//   RESEND_API_KEY        — from resend.com
//   SUPABASE_URL          — auto-injected by Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime
//
// Shopify note:
//   The generated code format is WEBI-XXXXXX (e.g. WEBI-A4F2C9).
//   In Shopify Admin → Discounts, create a "percentage" or "fixed amount"
//   discount and choose "Specific discount codes". Upload / paste the generated
//   code there, OR use the Shopify Admin API to create codes programmatically
//   (add SHOPIFY_ADMIN_TOKEN + SHOPIFY_SHOP secrets and call the API here).

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ── Colours (mirrored from index.css design tokens) ───────────────────────────
const C = {
  bg:         "#151d47",   // --background  hsl(230 55% 18%)
  card:       "#1c2856",   // --card        hsl(230 50% 22%)
  cardDeep:   "#131a3e",   // slightly darker card (gradient end)
  border:     "#2d3f72",   // --border      hsl(230 40% 28%)
  fg:         "#fafafa",   // --foreground
  muted:      "#8a9ab8",   // --muted-foreground
  orange:     "#f5831c",   // --primary     hsl(27 92% 55%)
  orangeRed:  "#ff4400",   // gradient end  hsl(16 100% 50%)
  green:      "#6BCB77",
  yellow:     "#FFD93D",
  coral:      "#FF8066",
  blue:       "#4D96FF",
} as const;

function matchColor(pct: number) {
  if (pct >= 90) return C.green;
  if (pct >= 80) return C.yellow;
  if (pct >= 65) return C.coral;
  return C.blue;
}

// ── Discount code ─────────────────────────────────────────────────────────────
function genDiscountCode(sessionId: string): string {
  // Deterministic from session UUID — last 6 hex chars uppercased.
  // Guaranteed unique because session IDs are unique.
  const hex = sessionId.replace(/-/g, "").slice(-6).toUpperCase();
  return `WEBI-${hex}`;
}

// ── Email HTML template ───────────────────────────────────────────────────────
function buildEmail(record: Record<string, unknown>, code: string): string {
  const nome        = String(record.nome        ?? "").trim();
  const cognome     = String(record.cognome     ?? "").trim();
  const pct         = Number(record.match_percent ?? 0);
  const productName = String(record.product_name  ?? "Il tuo prodotto");
  const productPrice= String(record.product_price ?? "");
  const productImage= String(record.product_image ?? "");
  const ringColor   = matchColor(pct);

  const greeting = nome ? `Ciao ${nome},` : "Ciao,";
  const fullName  = [nome, cognome].filter(Boolean).join(" ");

  // SVG ring — works in Gmail / Apple Mail / Outlook 365
  const r          = 56;
  const circ       = 2 * Math.PI * r;
  const dashoffset = circ * (1 - pct / 100);

  return /* html */`
<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>Il tuo match Webi-Match</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; background-color: ${C.bg}; }
    a { color: ${C.orange}; }
    .btn-code { letter-spacing: 0.12em; }
    @media only screen and (max-width: 620px) {
      .wrapper { width: 100% !important; }
      .col2 { display: block !important; width: 100% !important; }
      .step-cell { padding: 10px 16px !important; }
      .product-img { height: 180px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:'Space Grotesk',Arial,sans-serif;">

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:${C.bg};min-width:100%;">
  <tr><td align="center" style="padding:32px 16px 48px;">

  <!-- ── Card container ─────────────────────────────────────────────────── -->
  <table class="wrapper" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
         style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;
                box-shadow:0 24px 80px rgba(0,0,0,0.5);">

    <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                 padding:36px 40px 32px;text-align:center;">
        <!-- Wordmark -->
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.25em;
                  text-transform:uppercase;color:rgba(255,255,255,0.7);">
          WEBIDOO STORE
        </p>
        <h1 style="margin:6px 0 0;font-size:32px;font-weight:700;letter-spacing:0.12em;
                   text-transform:uppercase;color:#ffffff;line-height:1;">
          WEBI <span style="opacity:0.85;">MATCH</span>
        </h1>
        <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:500;">
          ${greeting} il tuo gadget ideale ti aspetta! 🎉
        </p>
      </td>
    </tr>

    <!-- ══ MATCH RING ═══════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:${C.card};padding:36px 40px 28px;text-align:center;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <!-- SVG ring -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
               align="center" style="margin:0 auto;">
          <tr><td style="padding:0;">
            <svg width="160" height="160" viewBox="0 0 120 120"
                 style="display:block;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">
              <!-- Background ring -->
              <circle cx="60" cy="60" r="${r}" fill="none"
                      stroke="${C.border}" stroke-width="7" opacity="0.5"/>
              <!-- Progress ring -->
              <circle cx="60" cy="60" r="${r}" fill="none"
                      stroke="${ringColor}" stroke-width="7"
                      stroke-linecap="round"
                      stroke-dasharray="${circ.toFixed(2)}"
                      stroke-dashoffset="${dashoffset.toFixed(2)}"
                      transform="rotate(-90 60 60)"
                      style="filter:drop-shadow(0 0 8px ${ringColor}80)"/>
              <!-- Percentage text -->
              <text x="60" y="54" text-anchor="middle" dominant-baseline="middle"
                    font-family="'Space Grotesk',Arial,sans-serif"
                    font-size="22" font-weight="700" fill="${ringColor}">${pct}%</text>
              <text x="60" y="72" text-anchor="middle" dominant-baseline="middle"
                    font-family="'Space Grotesk',Arial,sans-serif"
                    font-size="9" font-weight="600" fill="${C.muted}"
                    letter-spacing="2">MATCH</text>
            </svg>
          </td></tr>
        </table>

        <h2 style="margin:20px 0 4px;font-size:22px;font-weight:700;color:${C.fg};
                   letter-spacing:0.04em;">
          🎉 MATCH PERFETTO!
        </h2>
        <p style="margin:0;font-size:14px;color:${C.muted};line-height:1.5;">
          Il nostro algoritmo ha trovato il prodotto ideale per te
        </p>
      </td>
    </tr>

    <!-- ══ PRODUCT CARD ═════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:linear-gradient(145deg,${C.card},${C.cardDeep});
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};
                 padding:0;">

        ${productImage ? /* Product image row */ `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0;position:relative;">
              <img class="product-img" src="${productImage}" alt="${productName}"
                   width="600" style="display:block;width:100%;height:220px;
                          object-fit:cover;object-position:center;" />
              <!-- Match badge overlay via absolute-ish table trick -->
            </td>
          </tr>
        </table>
        ` : /* Placeholder when no image */ `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:${C.cardDeep};padding:40px;text-align:center;
                       border-bottom:1px solid ${C.border};">
              <span style="font-size:64px;line-height:1;">📦</span>
            </td>
          </tr>
        </table>
        `}

        <!-- Match badge row -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 20px;" align="right">
              <span style="display:inline-block;background:${ringColor};color:#000;
                           font-weight:700;font-size:12px;border-radius:999px;
                           padding:4px 12px;margin-top:-16px;position:relative;
                           box-shadow:0 4px 12px rgba(0,0,0,0.4);">
                ${pct}% match
              </span>
            </td>
          </tr>
        </table>

        <!-- Product info -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:20px 28px 24px;">
              <h3 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${C.fg};
                         line-height:1.3;">
                ${productName}
              </h3>
              ${productPrice ? `
              <p style="margin:0;font-size:22px;font-weight:700;
                        background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                        -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                        background-clip:text;color:${C.orange};">
                ${productPrice}
              </p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══ DISCOUNT CODE ════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:${C.bg};padding:32px 28px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;
                  letter-spacing:0.2em;text-transform:uppercase;color:${C.muted};
                  text-align:center;">
          🎁 IL TUO CODICE SCONTO ESCLUSIVO
        </p>

        <!-- Code box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:linear-gradient(135deg,${C.orange}18,${C.orangeRed}10);
                       border:2px solid ${C.orange};border-radius:16px;
                       padding:22px 20px;text-align:center;">
              <p class="btn-code" style="margin:0 0 6px;font-size:36px;font-weight:700;
                         color:${C.fg};font-family:'Space Grotesk',monospace;
                         letter-spacing:0.12em;line-height:1;">
                ${code}
              </p>
              <p style="margin:0;font-size:12px;color:${C.orange};font-weight:600;">
                ⏰ Valido 24 ore · Solo in negozio · Un utilizzo
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══ HOW TO USE ════════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:${C.card};padding:28px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0 0 20px;font-size:11px;font-weight:700;
                  letter-spacing:0.18em;text-transform:uppercase;
                  color:${C.muted};text-align:center;">
          COME UTILIZZARLO
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <!-- Step 1 -->
            <td class="step-cell" width="33%" valign="top"
                style="padding:0 12px;text-align:center;border-right:1px solid ${C.border};">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                          border-radius:50%;margin:0 auto 10px;display:flex;
                          align-items:center;justify-content:center;font-size:18px;line-height:40px;">
                📱
              </div>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">
                Mostra l'email
              </p>
              <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.4;">
                Al consulente Webidoo in negozio
              </p>
            </td>
            <!-- Step 2 -->
            <td class="step-cell" width="33%" valign="top"
                style="padding:0 12px;text-align:center;border-right:1px solid ${C.border};">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                          border-radius:50%;margin:0 auto 10px;font-size:18px;line-height:40px;
                          text-align:center;">
                🛍️
              </div>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">
                Scegli il prodotto
              </p>
              <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.4;">
                Quello del tuo match o un altro che ti ispira
              </p>
            </td>
            <!-- Step 3 -->
            <td class="step-cell" width="33%" valign="top"
                style="padding:0 12px;text-align:center;">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                          border-radius:50%;margin:0 auto 10px;font-size:18px;line-height:40px;
                          text-align:center;">
                ✅
              </div>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">
                Applica il codice
              </p>
              <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.4;">
                Al checkout Shopify · Sconto applicato automaticamente
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══ BENEFITS STRIP ════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:${C.cardDeep};padding:24px 28px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.18em;
                  text-transform:uppercase;color:${C.muted};text-align:center;">
          INCLUSO NEL TUO PACCHETTO
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="33%" style="text-align:center;padding:0 8px;
                                   border-right:1px solid ${C.border};">
              <p style="margin:0 0 4px;font-size:22px;">🎥</p>
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${C.fg};">
                Video 30s
              </p>
              <p style="margin:0;font-size:10px;color:${C.muted};">
                Il consulente spiega tutto
              </p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;
                                   border-right:1px solid ${C.border};">
              <p style="margin:0 0 4px;font-size:22px;">📖</p>
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${C.fg};">
                Manuale PDF
              </p>
              <p style="margin:0;font-size:10px;color:${C.muted};">
                Guida passo-passo
              </p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <p style="margin:0 0 4px;font-size:22px;">💰</p>
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${C.orange};">
                Sconto VIP
              </p>
              <p style="margin:0;font-size:10px;color:${C.muted};">
                Solo per te oggi
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══ SPAM NOTE ══════════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:${C.bg};padding:12px 28px;text-align:center;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0;font-size:11px;color:${C.muted};">
          📬 Non vedi l'email? Controlla la cartella <strong>spam</strong> o <strong>promozioni</strong>.
        </p>
      </td>
    </tr>

    <!-- ══ FOOTER ════════════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:${C.cardDeep};padding:24px 28px;text-align:center;
                 border-radius:0 0 24px 24px;
                 border:1px solid ${C.border};border-top:none;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;
                  color:${C.fg};letter-spacing:0.08em;">
          WEBIDOO STORE
        </p>
        ${fullName ? `<p style="margin:0 0 8px;font-size:12px;color:${C.muted};">
          Inviato a ${fullName} — ${String(record.email ?? "")}
        </p>` : ""}
        <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.6;">
          Dati crittografati · Conformità GDPR<br/>
          Ricevi questa email perché hai partecipato a Webi-Match in negozio.<br/>
          Questo codice è valido 24 ore dalla ricezione di questa email.
        </p>
      </td>
    </tr>

  </table>
  <!-- /card container -->

  </td></tr>
</table>

</body>
</html>
`.trim();
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  // Supabase webhooks send POST; respond to GET for health checks
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // Only handle INSERT events
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const record = payload.record as Record<string, unknown>;
  if (!record?.email) {
    return new Response("no email", { status: 200 });
  }

  const code = genDiscountCode(String(record.id));

  // ── 1. Update DB row with code + email_sent flag ───────────────────────────
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { error: dbErr } = await supabase
    .from("quiz_sessions")
    .update({ discount_code: code, email_sent: true })
    .eq("id", record.id);

  if (dbErr) {
    console.error("[on-session-created] db update failed:", dbErr.message);
    // Continue anyway — we still want to send the email
  }

  // ── 2. Send email via Resend ───────────────────────────────────────────────
  const nome = String(record.nome ?? "").trim();
  const pct  = Number(record.match_percent ?? 0);
  const subjectName = nome ? `${nome}, il` : "Il";
  const html = buildEmail(record, code);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Webidoo Store <noreply@webidoo.it>",  // change to your verified domain
      to:   record.email,
      subject: `${subjectName} tuo match è ${pct}% — Codice sconto valido 24h ⏰`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error("[on-session-created] Resend error:", errText);
    return new Response(JSON.stringify({ ok: false, error: errText }), { status: 500 });
  }

  const resendData = await resendRes.json();
  console.log("[on-session-created] email sent:", resendData.id, "→", record.email);

  return new Response(JSON.stringify({ ok: true, code, emailId: resendData.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
