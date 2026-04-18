export interface EmailData {
  nome?:             string;
  cognome?:          string;
  email?:            string;
  match_percent:     number;
  product_name:      string;
  product_price?:    string;
  product_image?:    string;
  product_video?:    string;
  discount_code:     string;
  discount_percent?: number;
  faq?: Array<{ q: string; a: string }>;
}

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
  if (pct >= 90) return "MATCH PERFETTO";
  if (pct >= 80) return "OTTIMO MATCH";
  if (pct >= 65) return "BUON MATCH";
  return "MATCH TROVATO";
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const BARCODE_SVG = (color: string) => `<svg width="200" height="30" viewBox="0 0 200 30" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="0" width="3" height="30" fill="${color}" opacity="0.55"/>
  <rect x="7" y="0" width="1" height="30" fill="${color}" opacity="0.80"/>
  <rect x="10" y="0" width="4" height="30" fill="${color}" opacity="0.50"/>
  <rect x="16" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="20" y="0" width="5" height="30" fill="${color}" opacity="0.55"/>
  <rect x="27" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="30" y="0" width="3" height="30" fill="${color}" opacity="0.50"/>
  <rect x="36" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="40" y="0" width="4" height="30" fill="${color}" opacity="0.55"/>
  <rect x="47" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="50" y="0" width="6" height="30" fill="${color}" opacity="0.50"/>
  <rect x="58" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="62" y="0" width="3" height="30" fill="${color}" opacity="0.55"/>
  <rect x="68" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="71" y="0" width="4" height="30" fill="${color}" opacity="0.50"/>
  <rect x="78" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="83" y="0" width="5" height="30" fill="${color}" opacity="0.55"/>
  <rect x="90" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="93" y="0" width="3" height="30" fill="${color}" opacity="0.50"/>
  <rect x="98" y="0" width="4" height="30" fill="${color}" opacity="0.70"/>
  <rect x="105" y="0" width="2" height="30" fill="${color}" opacity="0.55"/>
  <rect x="109" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="113" y="0" width="5" height="30" fill="${color}" opacity="0.50"/>
  <rect x="121" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="125" y="0" width="3" height="30" fill="${color}" opacity="0.55"/>
  <rect x="131" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="134" y="0" width="4" height="30" fill="${color}" opacity="0.50"/>
  <rect x="141" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="146" y="0" width="6" height="30" fill="${color}" opacity="0.55"/>
  <rect x="155" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="158" y="0" width="3" height="30" fill="${color}" opacity="0.50"/>
  <rect x="163" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="168" y="0" width="4" height="30" fill="${color}" opacity="0.55"/>
  <rect x="175" y="0" width="1" height="30" fill="${color}" opacity="0.85"/>
  <rect x="178" y="0" width="5" height="30" fill="${color}" opacity="0.50"/>
  <rect x="186" y="0" width="2" height="30" fill="${color}" opacity="0.70"/>
  <rect x="190" y="0" width="3" height="30" fill="${color}" opacity="0.55"/>
  <rect x="196" y="0" width="2" height="30" fill="${color}" opacity="0.80"/>
</svg>`;

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(url: string): string {
  const u = String(url).trim();
  return /^https:\/\//i.test(u) ? u : "";
}

function progressHtml(pct: number, color: string, muted: string): string {
  const filled = Math.round(pct / 10);
  const dots = '●'.repeat(filled) + '○'.repeat(10 - filled);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="text-align:center;padding:0;">
      <p style="margin:0;font-size:72px;font-weight:900;color:${color};line-height:1;font-family:Arial,Helvetica,sans-serif;mso-line-height-rule:exactly;">${pct}<span style="font-size:36px;font-weight:900;">%</span></p>
      <p style="margin:8px 0 6px;font-size:9px;font-weight:700;color:${muted};letter-spacing:0.28em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;text-align:center;">COMPATIBILITÀ</p>
      <p style="margin:0;font-size:20px;letter-spacing:4px;color:${color};text-align:center;font-family:Arial,Helvetica,sans-serif;">${dots}</p>
  </td></tr></table>`;
}

export function buildEmailHtml(data: EmailData): string {
  const nome        = escHtml((data.nome ?? "").trim());
  const cognome     = escHtml((data.cognome ?? "").trim());
  const pct         = data.match_percent;
  const productName = escHtml(data.product_name);
  const productPrice= escHtml(data.product_price ?? "");
  const productImage= safeUrl(data.product_image ?? "");
  const productVideo= safeUrl(data.product_video ?? "");
  const code        = escHtml(data.discount_code);
  const recipientEmail = escHtml(data.email ?? "");
  const faq         = (data.faq ?? []).filter(f => f.q.trim() && f.a.trim())
                        .map(f => ({ q: escHtml(f.q), a: escHtml(f.a) }));
  const ringColor   = matchColor(pct);
  const badgeLabel  = matchBadgeLabel(pct);
  const fullName    = [nome, cognome].filter(Boolean).join(" ");
  const vidId       = data.product_video ? youtubeId(safeUrl(data.product_video)) : null;
  const thumbUrl    = vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : null;

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
                padding:12px 20px!important;border-right:none!important;border-bottom:1px solid #2a3a68!important}
      .step-col:last-child{border-bottom:none!important}
      .hide-mobile{display:none!important;max-height:0!important;overflow:hidden!important}
      .product-name-td{display:block!important;width:100%!important}
      .product-badge-td{display:block!important;width:100%!important;text-align:center!important;padding:8px 0 0!important}
      h1{font-size:22px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:'Space Grotesk',Arial,Helvetica,sans-serif;">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:${C.bg};line-height:1px;">
  🎉 ${pct}% di compatibilità — Il tuo codice ${code} scade in 24 ore!
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:28px 12px 52px;">

<table class="wrapper" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
       style="max-width:600px;width:100%;border-radius:20px;border:1px solid ${C.border};box-shadow:0 32px 80px rgba(0,0,0,0.7);">

  <!-- TOP ACCENT -->
  <tr>
    <td height="4" style="background:${C.orange};background:linear-gradient(90deg,${C.orange},${C.orangeRed},${C.orange});font-size:0;line-height:0;border-radius:20px 20px 0 0;">&nbsp;</td>
  </tr>

  <!-- HEADER -->
  <tr>
    <td style="background:${C.cardHeader};padding:36px 40px 32px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr>
          <td style="background:${C.orange};background:linear-gradient(135deg,${C.orange},${C.orangeRed});border-radius:10px;padding:7px 22px;">
            <span style="font-size:13px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#fff;">WEBI·MATCH</span>
          </td>
        </tr>
      </table>
      <h1 style="margin:22px 0 8px;font-size:30px;font-weight:800;color:${C.fg};line-height:1.15;letter-spacing:-0.01em;">
        ${nome
          ? `Ciao <span style="color:${C.orange};">${nome}</span>,<br/>abbiamo trovato il tuo match!`
          : `Abbiamo trovato il tuo match!`}
      </h1>
      <p style="margin:0;font-size:15px;color:${C.muted};line-height:1.6;">
        Il nostro algoritmo ha analizzato le tue risposte<br/>e ha selezionato il
        <strong style="color:${C.fg};">gadget perfetto per il tuo stile di vita</strong>.
      </p>
    </td>
  </tr>

  <!-- MATCH RING -->
  <tr>
    <td style="background:${C.card};padding:40px 40px 36px;text-align:center;border-top:1px solid ${C.border};">
      ${progressHtml(pct, ringColor, C.muted)}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 0;">
        <tr>
          <td style="background:${ringColor}22;border:1.5px solid ${ringColor}66;border-radius:999px;padding:7px 22px;">
            <span style="font-size:12px;font-weight:700;color:${ringColor};letter-spacing:0.12em;">${badgeLabel}</span>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-size:13px;color:${C.muted};line-height:1.5;">
        Compatibilità verificata su 8 categorie di preferenze personali
      </p>
    </td>
  </tr>

  <!-- PRODUCT -->
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
        <tr>
          <td style="padding:20px 32px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr valign="top">
                <td class="product-name-td" valign="top">
                  <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${C.fg};line-height:1.2;letter-spacing:-0.01em;">${productName}</h2>
                  ${productPrice ? `<p style="margin:0;font-size:26px;font-weight:700;color:${C.orange};line-height:1;">${productPrice}</p>` : ""}
                </td>
                <td class="product-badge-td" align="right" valign="top" style="padding-left:12px;">
                  <span style="display:inline-block;white-space:nowrap;background:${ringColor};color:#000;font-size:13px;font-weight:700;border-radius:20px;padding:7px 16px;">${pct}% match</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- TICKET / DISCOUNT CODE -->
  <tr>
    <td style="background:${C.card};padding:28px 24px 32px;border-top:1px solid ${C.border};">
      <p style="margin:0 0 16px;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${C.muted};text-align:center;">IL TUO CODICE SCONTO ESCLUSIVO</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border-radius:16px;border:2px solid ${C.orange};box-shadow:0 8px 48px rgba(245,131,28,0.35);">
        <tr>
          <td style="background:${C.orange};background:linear-gradient(90deg,${C.orange},${C.orangeRed},${C.orange});padding:11px 24px;border-radius:14px 14px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.14em;">SCONTO SPECIALE</td>
                <td align="right" style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:0.1em;">WEBIDOO STORE</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${C.cardHeader};padding:30px 28px 26px;text-align:center;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${C.orange};letter-spacing:0.24em;text-transform:uppercase;">Inserisci al checkout</p>
            <p style="margin:0 0 18px;font-size:38px;font-weight:900;color:${C.fg};font-family:'Courier New',Courier,monospace;letter-spacing:0.06em;line-height:1;white-space:nowrap;">${code}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
              <tr>
                <td style="background:${C.orange};border-radius:999px;padding:5px 10px;white-space:nowrap;">
                  <span style="font-size:10px;font-weight:700;color:#fff;display:inline-block;white-space:nowrap;">✓ 24 ore</span>
                </td>
                <td width="6">&nbsp;</td>
                <td style="background:${C.cardAlt};border:1px solid ${C.border};border-radius:999px;padding:5px 10px;white-space:nowrap;">
                  <span style="font-size:10px;font-weight:600;color:${C.fg};display:inline-block;white-space:nowrap;">🏪 In negozio</span>
                </td>
                <td width="6">&nbsp;</td>
                <td style="background:${C.cardAlt};border:1px solid ${C.border};border-radius:999px;padding:5px 10px;white-space:nowrap;">
                  <span style="font-size:10px;font-weight:600;color:${C.fg};display:inline-block;white-space:nowrap;">1️⃣ Un uso</span>
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
            ${BARCODE_SVG(C.orange)}
            <p style="margin:5px 0 0;font-size:8px;color:${C.muted};letter-spacing:0.12em;text-transform:uppercase;">Biglietto Sconto Webidoo</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HOW TO USE -->
  <tr>
    <td style="background:${C.cardAlt};padding:28px 24px;border-top:1px solid ${C.border};">
      <p style="margin:0 0 22px;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${C.muted};text-align:center;">COME RISCUOTERE LO SCONTO</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr valign="top">
          <td class="step-col" width="33%" style="padding:0 16px 0 8px;text-align:center;border-right:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="text-align:center;padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;min-width:44px;border-radius:22px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});text-align:center;vertical-align:middle;font-size:14px;font-weight:800;color:#fff;overflow:hidden;line-height:44px;mso-line-height-rule:exactly;">1</td></tr>
              </table>
            </td></tr></table>
            <p style="margin:10px 0 4px;font-size:13px;font-weight:700;color:${C.fg};text-align:center;">Mostra l'email</p>
            <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.5;text-align:center;">Al consulente Webidoo in negozio</p>
          </td>
          <td class="step-col" width="33%" style="padding:0 16px;text-align:center;border-right:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="text-align:center;padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;min-width:44px;border-radius:22px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});text-align:center;vertical-align:middle;font-size:14px;font-weight:800;color:#fff;overflow:hidden;line-height:44px;mso-line-height-rule:exactly;">2</td></tr>
              </table>
            </td></tr></table>
            <p style="margin:10px 0 4px;font-size:13px;font-weight:700;color:${C.fg};text-align:center;">Scegli il prodotto</p>
            <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.5;text-align:center;">Il tuo match o qualsiasi altro</p>
          </td>
          <td class="step-col" width="33%" style="padding:0 8px 0 16px;text-align:center;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="text-align:center;padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;min-width:44px;border-radius:22px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});text-align:center;vertical-align:middle;font-size:14px;font-weight:800;color:#fff;overflow:hidden;line-height:44px;mso-line-height-rule:exactly;">3</td></tr>
              </table>
            </td></tr></table>
            <p style="margin:10px 0 4px;font-size:13px;font-weight:700;color:${C.fg};text-align:center;">Applica il codice</p>
            <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.5;text-align:center;">Al checkout — sconto immediato</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- VIDEO -->
  ${productVideo ? `
  <tr>
    <td style="background:${C.card};padding:24px;border-top:1px solid ${C.border};">
      <a href="${productVideo}" target="_blank" style="display:block;text-decoration:none;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.border};border-radius:14px;">
          ${thumbUrl ? `<tr>
            <td style="padding:0;">
              <img src="${thumbUrl}" alt="Video del consulente" width="552"
                   style="width:100%;height:200px;object-fit:cover;object-position:center;display:block;border-radius:14px 14px 0 0;"/>
            </td>
          </tr>` : ""}
          <tr>
            <td style="background:${C.cardHeader};padding:20px;text-align:center;border-radius:${thumbUrl ? "0 0 14px 14px" : "14px"};">
              <table role="presentation" width="52" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr><td width="52" height="52" align="center" valign="middle" style="width:52px;height:52px;min-width:52px;border-radius:26px;background:${C.orange};text-align:center;vertical-align:middle;font-size:22px;color:#fff;overflow:hidden;line-height:52px;mso-line-height-rule:exactly;padding-left:4px;">&#9658;</td></tr>
              </table>
              <p style="margin:10px 0 3px;font-size:14px;font-weight:700;color:${C.fg};">Guarda la presentazione del consulente</p>
              <p style="margin:0;font-size:11px;color:${C.muted};">30 secondi per scoprire tutto sul tuo prodotto</p>
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>` : ""}

  <!-- FAQ -->
  ${faq.length > 0 ? `
  <tr>
    <td style="background:${C.cardAlt};padding:28px 24px;border-top:1px solid ${C.border};">
      <p style="margin:0 0 20px;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${C.muted};text-align:center;">DOMANDE FREQUENTI</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${faq.map((item, i) => `
        <tr>
          <td style="padding:${i > 0 ? "14px" : "0"} 0 0;">
            ${i > 0 ? `<div style="border-top:1px solid ${C.border};margin-bottom:14px;"></div>` : ""}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="4" style="background:${C.orange};border-radius:4px;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                <td style="padding:4px 0 4px 14px;">
                  <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${C.fg};line-height:1.4;">${item.q}</p>
                  <p style="margin:0;font-size:13px;color:${C.muted};line-height:1.65;">${item.a}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>` : ""}

  <!-- ACTION REMINDER -->
  <tr>
    <td style="background:${C.cardAlt};padding:26px 24px;border-top:1px solid ${C.border};">
      <p style="margin:0 0 18px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:${C.orange};text-align:center;">AZIONE RICHIESTA</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr valign="top">
          <td class="step-col" width="33%" style="text-align:center;padding:0 12px;border-right:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="text-align:center;padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;min-width:44px;border-radius:22px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});text-align:center;vertical-align:middle;font-size:20px;font-weight:800;color:#fff;overflow:hidden;line-height:44px;mso-line-height-rule:exactly;">&#8595;</td></tr>
              </table>
            </td></tr></table>
            <p style="margin:10px 0 4px;font-size:12px;font-weight:700;color:${C.fg};text-align:center;">Salva l'email</p>
            <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.5;text-align:center;">Avrai il codice a portata di mano</p>
          </td>
          <td class="step-col" width="33%" style="text-align:center;padding:0 12px;border-right:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="text-align:center;padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;min-width:44px;border-radius:22px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});text-align:center;vertical-align:middle;font-size:11px;font-weight:800;color:#fff;overflow:hidden;line-height:44px;mso-line-height-rule:exactly;">24h</td></tr>
              </table>
            </td></tr></table>
            <p style="margin:10px 0 4px;font-size:12px;font-weight:700;color:${C.fg};text-align:center;">Entro 24 ore</p>
            <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.5;text-align:center;">Il codice scade presto</p>
          </td>
          <td class="step-col" width="33%" style="text-align:center;padding:0 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="text-align:center;padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;min-width:44px;border-radius:22px;background:linear-gradient(135deg,${C.orange},${C.orangeRed});text-align:center;vertical-align:middle;font-size:20px;font-weight:800;color:#fff;overflow:hidden;line-height:44px;mso-line-height-rule:exactly;">&#8594;</td></tr>
              </table>
            </td></tr></table>
            <p style="margin:10px 0 4px;font-size:12px;font-weight:700;color:${C.fg};text-align:center;">Vieni in store</p>
            <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.5;text-align:center;">Mostra al consulente</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SPAM NOTE -->
  <tr>
    <td style="background:${C.card};padding:14px 28px;text-align:center;border-top:1px solid ${C.border};">
      <p style="margin:0;font-size:11px;color:${C.muted};">Le immagini non si caricano? Clicca <strong style="color:${C.fg};">&ldquo;Mostra immagini&rdquo;</strong> in cima all&rsquo;email per visualizzare il prodotto e il video del consulente.</p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:${C.cardHeader};padding:24px 32px 28px;text-align:center;border-top:1px solid ${C.border};border-radius:0 0 20px 20px;">
      <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:${C.fg};letter-spacing:0.1em;">WEBIDOO STORE</p>
      <p style="margin:0 0 12px;font-size:11px;color:${C.muted};">Powered by Webi-Match</p>
      ${fullName ? `<p style="margin:0 0 10px;font-size:12px;color:${C.muted};">Inviato a <strong style="color:${C.fg};">${fullName}</strong>${recipientEmail ? ` · ${recipientEmail}` : ""}</p>` : ""}
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
