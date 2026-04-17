// Supabase Edge Function — triggered by Database Webhook on quiz_sessions INSERT
// Generates a unique discount code, sends the match email via Brevo,
// then updates the session row with the code and email_sent = true.
//
// Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   BREVO_API_KEY             — from brevo.com
//   SUPABASE_URL              — auto-injected by Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_KEY   = Deno.env.get("BREVO_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const C = {
  bg:         "#0d1228",
  card:       "#151d47",
  cardAlt:    "#1a2550",
  cardHeader: "#101628",
  border:     "#2a3a68",
  fg:         "#f0f4ff",
  muted:      "#7a8fbb",
  orange:     "#f5831c",
  orangeRed:  "#e8420a",
  green:      "#6BCB77",
  yellow:     "#FFD93D",
  coral:      "#FF8066",
  blue:       "#4D96FF",
} as const;

function matchColor(pct: number): string {
  if (pct >= 90) return C.green;
  if (pct >= 80) return C.yellow;
  if (pct >= 65) return C.coral;
  return C.blue;
}

function matchBadgeLabel(pct: number): string {
  if (pct >= 90) return "🏆 MATCH PERFETTO";
  if (pct >= 80) return "⭐ OTTIMO MATCH";
  if (pct >= 65) return "👍 BUON MATCH";
  return "💡 MATCH TROVATO";
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Format: WEBI-XXXX05 / WEBI-XXXX08 / WEBI-XXXX10
// Last 2 digits encode the discount %, readable by the consultant at checkout.
function genDiscountCode(sessionId: string, discountPct: number): string {
  const hex    = sessionId.replace(/-/g, "").slice(-4).toUpperCase();
  const suffix = String(discountPct).padStart(2, "0");
  return `WEBI-${hex}${suffix}`;
}

const BARCODE_RECTS = [
  [2,3,.55],[7,1,.80],[10,4,.50],[16,2,.70],[20,5,.55],[27,1,.85],[30,3,.50],
  [36,2,.70],[40,4,.55],[47,1,.85],[50,6,.50],[58,2,.70],[62,3,.55],[68,1,.85],
  [71,4,.50],[78,2,.70],[83,5,.55],[90,1,.85],[93,3,.50],[98,4,.70],[105,2,.55],
  [109,1,.85],[113,5,.50],[121,2,.70],[125,3,.55],[131,1,.85],[134,4,.50],
  [141,2,.70],[146,6,.55],[155,1,.85],[158,3,.50],[163,2,.70],[168,4,.55],
  [175,1,.85],[178,5,.50],[186,2,.70],[190,3,.55],[196,2,.80],
] as const;

function barcodesvg(color: string): string {
  const rects = BARCODE_RECTS.map(([x,w,o]) =>
    `<rect x="${x}" y="0" width="${w}" height="30" fill="${color}" opacity="${o}"/>`
  ).join("");
  return `<svg width="200" height="30" viewBox="0 0 200 30" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

function buildEmail(record: Record<string, unknown>, code: string): string {
  const nome         = String(record.nome    ?? "").trim();
  const cognome      = String(record.cognome ?? "").trim();
  const pct          = Number(record.match_percent ?? 0);
  const productName  = String(record.product_name  ?? "Il tuo prodotto");
  const productPrice = String(record.product_price ?? "");
  const productImage = String(record.product_image ?? "");
  const productVideo = String(record.product_video ?? "");
  const ringColor    = matchColor(pct);
  const badgeLabel   = matchBadgeLabel(pct);
  const fullName     = [nome, cognome].filter(Boolean).join(" ");
  const vidId        = productVideo ? youtubeId(productVideo) : null;
  const thumbUrl     = vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : null;

  return `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <title>Il tuo match Webi-Match</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block}
    body{margin:0!important;padding:0!important;background-color:${C.bg}}
    a{color:${C.orange};text-decoration:none}
    @media only screen and (max-width:620px){
      .wrapper{width:100%!important;border-radius:0!important}
      .step-col{display:block!important;width:100%!important;text-align:center!important;
                padding:12px 20px!important;border-right:none!important;border-bottom:1px solid ${C.border}!important}
      .step-col:last-child{border-bottom:none!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:'Space Grotesk',Arial,Helvetica,sans-serif;">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:${C.bg};line-height:1px;">
  🎉 ${pct}% di compatibilità — Il tuo codice ${code} scade in 24 ore!
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:28px 12px 52px;">
<table class="wrapper" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
       style="max-width:600px;width:100%;border-radius:20px;border:1px solid ${C.border};box-shadow:0 32px 80px rgba(0,0,0,0.7);">

  <tr><td height="4" style="background:${C.orange};background:linear-gradient(90deg,${C.orange},${C.orangeRed},${C.orange});font-size:0;line-height:0;border-radius:20px 20px 0 0;">&nbsp;</td></tr>

  <tr>
    <td style="background:${C.cardHeader};padding:36px 40px 32px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr><td style="background:${C.orange};background:linear-gradient(135deg,${C.orange},${C.orangeRed});border-radius:10px;padding:7px 22px;">
          <span style="font-size:13px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#fff;">WEBI·MATCH</span>
        </td></tr>
      </table>
      <h1 style="margin:22px 0 8px;font-size:30px;font-weight:800;color:${C.fg};line-height:1.15;letter-spacing:-0.01em;">
        ${nome ? `Ciao <span style="color:${C.orange};">${nome}</span>,<br/>abbiamo trovato il tuo match! 🎉` : "Abbiamo trovato il tuo match! 🎉"}
      </h1>
      <p style="margin:0;font-size:15px;color:${C.muted};line-height:1.6;">
        Il nostro algoritmo ha analizzato le tue risposte<br/>e ha selezionato il <strong style="color:${C.fg};">gadget perfetto per il tuo stile di vita</strong>.
      </p>
    </td>
  </tr>

  <tr>
    <td style="background:${C.card};padding:48px 40px 40px;text-align:center;border-top:1px solid ${C.border};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
        <tr>
          <td width="140" height="140" align="center" valign="middle"
              style="width:140px;height:140px;border-radius:70px;border:10px solid ${ringColor};background-color:${ringColor}18;text-align:center;vertical-align:middle;">
            <p style="margin:0 0 4px;font-size:42px;font-weight:800;color:${ringColor};line-height:1;font-family:'Space Grotesk',Arial,sans-serif;">${pct}%</p>
            <p style="margin:0;font-size:9px;font-weight:700;color:${C.muted};letter-spacing:2px;font-family:Arial,sans-serif;">COMPATIBILITÀ</p>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 0;">
        <tr><td style="background:${ringColor}22;border:1.5px solid ${ringColor}66;border-radius:999px;padding:7px 22px;">
          <span style="font-size:12px;font-weight:700;color:${ringColor};letter-spacing:0.12em;">${badgeLabel}</span>
        </td></tr>
      </table>
      <p style="margin:14px 0 0;font-size:13px;color:${C.muted};line-height:1.5;">Compatibilità verificata su 8 categorie di preferenze personali</p>
    </td>
  </tr>

  <tr>
    <td style="background:${C.card};padding:0;border-top:1px solid ${C.border};">
      <p style="margin:0;padding:22px 32px 14px;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${C.muted};text-align:center;">── IL TUO GADGET IDEALE ──</p>
      ${productImage
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
             <tr><td style="padding:0 24px;">
               <img src="${productImage}" alt="${productName}" width="552"
                    style="width:100%;height:230px;object-fit:cover;object-position:center;border-radius:14px;border:1px solid ${C.border};display:block;"/>
             </td></tr>
           </table>`
        : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
             <tr><td style="padding:0 24px;">
               <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                 <tr><td style="background:${C.cardHeader};height:160px;text-align:center;vertical-align:middle;border-radius:14px;border:1px solid ${C.border};">
                   <span style="font-size:64px;line-height:1;">📦</span>
                 </td></tr>
               </table>
             </td></tr>
           </table>`}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:20px 32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr valign="top">
              <td>
                <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${C.fg};line-height:1.2;letter-spacing:-0.01em;">${productName}</h2>
                ${productPrice ? `<p style="margin:0;font-size:26px;font-weight:700;color:${C.orange};line-height:1;">${productPrice}</p>` : ""}
              </td>
              <td align="right" valign="top" style="padding-left:12px;white-space:nowrap;">
                <span style="display:inline-block;background:${ringColor};color:#000;font-size:12px;font-weight:700;border-radius:999px;padding:5px 14px;letter-spacing:0.04em;">${pct}% match</span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:${C.card};padding:28px 24px 32px;border-top:1px solid ${C.border};">
      <p style="margin:0 0 16px;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${C.muted};text-align:center;">🎁 IL TUO CODICE SCONTO ESCLUSIVO</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border-radius:16px;border:2px solid ${C.orange};box-shadow:0 8px 48px rgba(245,131,28,0.35);">
        <tr>
          <td style="background:${C.orange};background:linear-gradient(90deg,${C.orange},${C.orangeRed},${C.orange});padding:11px 24px;border-radius:14px 14px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.14em;">🎟&nbsp; SCONTO SPECIALE</td>
                <td align="right" style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:0.1em;">WEBIDOO STORE</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${C.cardHeader};padding:30px 28px 26px;text-align:center;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${C.orange};letter-spacing:0.24em;text-transform:uppercase;">Inserisci al checkout</p>
            <p style="margin:0 0 18px;font-size:46px;font-weight:900;color:${C.fg};font-family:'Courier New',Courier,monospace;letter-spacing:0.16em;line-height:1;">${code}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
              <tr>
                <td style="background:${C.orange};border-radius:999px;padding:6px 18px;white-space:nowrap;">
                  <span style="font-size:12px;font-weight:700;color:#fff;">⏰ Valido 24 ore</span>
                </td>
                <td width="8">&nbsp;</td>
                <td style="background:${C.cardAlt};border:1px solid ${C.border};border-radius:999px;padding:6px 14px;white-space:nowrap;">
                  <span style="font-size:12px;font-weight:600;color:${C.fg};">🏪 Solo in negozio</span>
                </td>
                <td width="8">&nbsp;</td>
                <td style="background:${C.cardAlt};border:1px solid ${C.border};border-radius:999px;padding:6px 14px;white-space:nowrap;">
                  <span style="font-size:12px;font-weight:600;color:${C.fg};">1️⃣ Un utilizzo</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${C.cardHeader};padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="border-top:2px dashed ${C.border};height:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${C.cardHeader};padding:12px 28px 14px;text-align:center;border-radius:0 0 14px 14px;">
            ${barcodesvg(C.orange)}
            <p style="margin:5px 0 0;font-size:8px;color:${C.muted};letter-spacing:0.12em;text-transform:uppercase;">Biglietto Sconto Webidoo</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:${C.cardAlt};padding:28px 24px;border-top:1px solid ${C.border};">
      <p style="margin:0 0 22px;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${C.muted};text-align:center;">COME RISCUOTERE LO SCONTO</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr valign="top">
          <td class="step-col" width="33%" style="padding:0 16px 0 8px;text-align:center;border-right:1px solid ${C.border};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr><td style="background:${C.orange};background:linear-gradient(135deg,${C.orange},${C.orangeRed});width:44px;height:44px;border-radius:50%;text-align:center;vertical-align:middle;line-height:44px;font-size:11px;font-weight:800;color:#fff;">1</td></tr>
            </table>
            <p style="margin:10px 0 4px;font-size:13px;font-weight:700;color:${C.fg};">Mostra l'email</p>
            <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.5;">Al consulente Webidoo in negozio</p>
          </td>
          <td class="step-col" width="33%" style="padding:0 16px;text-align:center;border-right:1px solid ${C.border};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr><td style="background:${C.orange};background:linear-gradient(135deg,${C.orange},${C.orangeRed});width:44px;height:44px;border-radius:50%;text-align:center;vertical-align:middle;line-height:44px;font-size:11px;font-weight:800;color:#fff;">2</td></tr>
            </table>
            <p style="margin:10px 0 4px;font-size:13px;font-weight:700;color:${C.fg};">Scegli il prodotto</p>
            <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.5;">Il tuo match o qualsiasi altro</p>
          </td>
          <td class="step-col" width="33%" style="padding:0 8px 0 16px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr><td style="background:${C.orange};background:linear-gradient(135deg,${C.orange},${C.orangeRed});width:44px;height:44px;border-radius:50%;text-align:center;vertical-align:middle;line-height:44px;font-size:11px;font-weight:800;color:#fff;">3</td></tr>
            </table>
            <p style="margin:10px 0 4px;font-size:13px;font-weight:700;color:${C.fg};">Applica il codice</p>
            <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.5;">Al checkout — sconto immediato</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${productVideo ? `
  <tr>
    <td style="background:${C.card};padding:24px;border-top:1px solid ${C.border};">
      <a href="${productVideo}" target="_blank" style="display:block;text-decoration:none;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.border};border-radius:14px;">
          ${thumbUrl ? `<tr><td style="padding:0;">
            <img src="${thumbUrl}" alt="Video del consulente" width="552"
                 style="width:100%;height:200px;object-fit:cover;object-position:center;display:block;border-radius:14px 14px 0 0;"/>
          </td></tr>` : ""}
          <tr>
            <td style="background:${C.cardHeader};padding:20px;text-align:center;border-radius:${thumbUrl ? "0 0 14px 14px" : "14px"};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td style="background:${C.orange};border-radius:50%;width:52px;height:52px;text-align:center;vertical-align:middle;line-height:52px;font-size:20px;color:#fff;">▶</td></tr>
              </table>
              <p style="margin:10px 0 3px;font-size:14px;font-weight:700;color:${C.fg};">Guarda la presentazione del consulente</p>
              <p style="margin:0;font-size:11px;color:${C.muted};">30 secondi per scoprire tutto sul tuo prodotto</p>
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>` : ""}

  <tr>
    <td style="background:${C.cardAlt};padding:26px 24px;border-top:1px solid ${C.border};">
      <p style="margin:0 0 18px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:${C.orange};text-align:center;">⚡ AZIONE RICHIESTA</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr valign="top">
          <td width="33%" style="text-align:center;padding:0 12px;border-right:1px solid ${C.border};">
            <p style="margin:0 0 6px;font-size:18px;">💾</p>
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">Salva l'email</p>
            <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.5;">Avrai il codice a portata di mano</p>
          </td>
          <td width="33%" style="text-align:center;padding:0 12px;border-right:1px solid ${C.border};">
            <p style="margin:0 0 6px;font-size:18px;">⏰</p>
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">Entro 24 ore</p>
            <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.5;">Il codice scade presto</p>
          </td>
          <td width="33%" style="text-align:center;padding:0 12px;">
            <p style="margin:0 0 6px;font-size:18px;">🏪</p>
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">Vieni in store</p>
            <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.5;">Mostra al consulente</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:${C.card};padding:14px 28px;text-align:center;border-top:1px solid ${C.border};">
      <p style="margin:0;font-size:11px;color:${C.muted};">📬 Non vedi questa email? Controlla la cartella <strong style="color:${C.fg};">spam</strong> o <strong style="color:${C.fg};">promozioni</strong>.</p>
    </td>
  </tr>

  <tr>
    <td style="background:${C.cardHeader};padding:24px 32px 28px;text-align:center;border-top:1px solid ${C.border};border-radius:0 0 20px 20px;">
      <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:${C.fg};letter-spacing:0.1em;">WEBIDOO STORE</p>
      <p style="margin:0 0 12px;font-size:11px;color:${C.muted};">Powered by Webi-Match</p>
      ${fullName ? `<p style="margin:0 0 10px;font-size:12px;color:${C.muted};">Inviato a <strong style="color:${C.fg};">${fullName}</strong> · ${String(record.email ?? "")}</p>` : ""}
      <div style="border-top:1px solid ${C.border};margin:12px auto;max-width:200px;"></div>
      <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.8;">
        Dati crittografati · Conformità GDPR<br/>
        Hai ricevuto questa email perché hai partecipato a Webi-Match in negozio.<br/>
        <span style="color:${C.orange};">Il codice sconto è valido 24 ore dalla ricezione.</span>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim();
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const record = payload.record as Record<string, unknown>;
  if (!record?.email) {
    return new Response("no email", { status: 200 });
  }

  const discountPct = Number(record.discount_percent ?? 5);
  const code = genDiscountCode(String(record.id), discountPct);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { error: dbErr } = await supabase
    .from("quiz_sessions")
    .update({ discount_code: code, email_sent: true })
    .eq("id", record.id);

  if (dbErr) console.error("[on-session-created] db update failed:", dbErr.message);

  const nome     = String(record.nome ?? "").trim();
  const pct      = Number(record.match_percent ?? 0);
  const subjName = nome ? `${nome}, il` : "Il";
  const html     = buildEmail(record, code);

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Webidoo Store", email: "costanzobruno.annichini@webidoo.com" },
      to: [{ email: record.email, name: [nome, String(record.cognome ?? "")].filter(Boolean).join(" ") }],
      subject: `${subjName} tuo match è ${pct}% — Codice sconto valido 24h ⏰`,
      htmlContent: html,
    }),
  });

  if (!brevoRes.ok) {
    const errText = await brevoRes.text();
    console.error("[on-session-created] Brevo error:", errText);
    return new Response(JSON.stringify({ ok: false, error: errText }), { status: 500 });
  }

  const brevoData = await brevoRes.json();
  console.log("[on-session-created] email sent:", brevoData.messageId, "→", record.email);

  return new Response(JSON.stringify({ ok: true, code, emailId: brevoData.messageId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
