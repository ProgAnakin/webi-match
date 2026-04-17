// Email HTML template — single source of truth used by:
//   • src/pages/EmailPreview.tsx  (live browser preview)
//   • supabase/functions/on-session-created/index.ts  (production sending)
//
// Keep both in sync when editing the design.

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
  bg:        "#151d47",
  card:      "#1c2856",
  cardDeep:  "#131a3e",
  border:    "#2d3f72",
  fg:        "#fafafa",
  muted:     "#8a9ab8",
  orange:    "#f5831c",
  orangeRed: "#ff4400",
  green:     "#6BCB77",
  yellow:    "#FFD93D",
  coral:     "#FF8066",
  blue:      "#4D96FF",
} as const;

function matchColor(pct: number): string {
  if (pct >= 90) return C.green;
  if (pct >= 80) return C.yellow;
  if (pct >= 65) return C.coral;
  return C.blue;
}

export function buildEmailHtml(data: EmailData): string {
  const nome         = (data.nome ?? "").trim();
  const cognome      = (data.cognome ?? "").trim();
  const pct          = data.match_percent;
  const productName  = data.product_name;
  const productPrice = data.product_price ?? "";
  const productImage = data.product_image ?? "";
  const productVideo = data.product_video ?? "";
  const code            = data.discount_code;
  const discountPct     = data.discount_percent ?? 5;
  const faq          = (data.faq ?? []).filter(f => f.q.trim() && f.a.trim());
  const ringColor    = matchColor(pct);

  const greeting  = nome ? `Ciao ${nome},` : "Ciao,";
  const fullName  = [nome, cognome].filter(Boolean).join(" ");

  const r          = 56;
  const circ       = 2 * Math.PI * r;
  const dashoffset = circ * (1 - pct / 100);

  return /* html */`
<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <meta name="x-apple-mail-message-headers" content="on" />
  <title>Il tuo match Webi-Match</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;max-width:100%}
    body{margin:0!important;padding:0!important;background-color:${C.bg}}
    a{color:${C.orange};text-decoration:none}
    @media only screen and (max-width:620px){
      .wrapper{width:100%!important;border-radius:0!important}
      .step-cell{padding:10px 8px!important}
      .product-img{height:180px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};
             font-family:'Space Grotesk',Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:${C.bg};min-width:100%;">
  <tr><td align="center" style="padding:32px 16px 48px;">

  <table class="wrapper" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
         style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;
                border:1px solid ${C.border};">

    <!-- HEADER -->
    <tr>
      <td style="background:${C.orange};
                 background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                 padding:36px 40px 32px;text-align:center;">
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

    <!-- MATCH RING -->
    <tr>
      <td style="background:${C.card};padding:36px 40px 28px;text-align:center;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
               style="margin:0 auto;">
          <tr><td>
            <svg width="160" height="160" viewBox="0 0 120 120"
                 style="display:block;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="${r}" fill="none"
                      stroke="${C.border}" stroke-width="7" opacity="0.5"/>
              <circle cx="60" cy="60" r="${r}" fill="none"
                      stroke="${ringColor}" stroke-width="7" stroke-linecap="round"
                      stroke-dasharray="${circ.toFixed(2)}"
                      stroke-dashoffset="${dashoffset.toFixed(2)}"
                      transform="rotate(-90 60 60)"/>
              <text x="60" y="54" text-anchor="middle" dominant-baseline="middle"
                    font-family="'Space Grotesk',Arial,sans-serif"
                    font-size="22" font-weight="700" fill="${ringColor}">${pct}%</text>
              <text x="60" y="72" text-anchor="middle" dominant-baseline="middle"
                    font-family="'Space Grotesk',Arial,sans-serif"
                    font-size="9" font-weight="600" fill="${C.muted}" letter-spacing="2">MATCH</text>
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

    <!-- PRODUCT CARD -->
    <tr>
      <td style="background:${C.card};
                 background:linear-gradient(145deg,${C.card},${C.cardDeep});
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};padding:0;">
        ${productImage
          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
               <tr><td style="padding:0;">
                 <img class="product-img" src="${productImage}" alt="${productName}"
                      width="600" style="display:block;width:100%;height:220px;
                             object-fit:cover;object-position:center;"/>
               </td></tr>
             </table>`
          : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
               <tr><td style="background:${C.cardDeep};padding:40px;text-align:center;
                              border-bottom:1px solid ${C.border};">
                 <span style="font-size:64px;line-height:1;">📦</span>
               </td></tr>
             </table>`
        }
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:8px 20px 0;" align="right">
              <span style="display:inline-block;background:${ringColor};color:#000;
                           font-weight:700;font-size:12px;border-radius:999px;
                           padding:4px 12px;
                           border:1px solid ${ringColor};">
                ${pct}% match
              </span>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:20px 28px 24px;">
              <h3 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${C.fg};line-height:1.3;">
                ${productName}
              </h3>
              ${productPrice
                ? `<p style="margin:0;font-size:22px;font-weight:700;color:${C.orange};">
                     ${productPrice}
                   </p>`
                : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- DISCOUNT CODE -->
    <tr>
      <td style="background:${C.bg};padding:32px 28px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.2em;
                  text-transform:uppercase;color:${C.muted};text-align:center;">
          🎁 IL TUO CODICE SCONTO ESCLUSIVO
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:${C.cardDeep};
                       background:linear-gradient(135deg,${C.orange}18,${C.orangeRed}10);
                       border:2px solid ${C.orange};border-radius:16px;
                       padding:22px 20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:36px;font-weight:700;color:${C.fg};
                        font-family:'Courier New',Courier,monospace;letter-spacing:0.12em;line-height:1;">
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

    <!-- HOW TO USE -->
    <tr>
      <td style="background:${C.card};padding:28px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:0.18em;
                  text-transform:uppercase;color:${C.muted};text-align:center;">
          COME UTILIZZARLO
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="33%" valign="top"
                style="padding:0 12px;text-align:center;border-right:1px solid ${C.border};">
              <div style="width:40px;height:40px;background:${C.orange};
                          background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                          border-radius:50%;margin:0 auto 10px;line-height:40px;text-align:center;font-size:18px;">
                📱
              </div>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">Mostra l'email</p>
              <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.4;">
                Al consulente Webidoo in negozio
              </p>
            </td>
            <td width="33%" valign="top"
                style="padding:0 12px;text-align:center;border-right:1px solid ${C.border};">
              <div style="width:40px;height:40px;background:${C.orange};
                          background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                          border-radius:50%;margin:0 auto 10px;line-height:40px;text-align:center;font-size:18px;">
                🛍️
              </div>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">Scegli il prodotto</p>
              <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.4;">
                Quello del tuo match o un altro
              </p>
            </td>
            <td width="33%" valign="top"
                style="padding:0 12px;text-align:center;">
              <div style="width:40px;height:40px;background:${C.orange};
                          background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                          border-radius:50%;margin:0 auto 10px;line-height:40px;text-align:center;font-size:18px;">
                ✅
              </div>
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.fg};">Applica il codice</p>
              <p style="margin:0;font-size:11px;color:${C.muted};line-height:1.4;">
                Al checkout · Sconto automatico
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- VIDEO BUTTON (only if URL is set) -->
    ${productVideo ? `
    <tr>
      <td style="background:${C.bg};padding:0 28px 24px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <!-- Thumbnail placeholder with play button -->
              <a href="${productVideo}" target="_blank" style="display:block;text-decoration:none;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:${C.cardDeep};
                               background:linear-gradient(135deg,${C.cardDeep},${C.card});
                               border:1px solid ${C.border};border-radius:14px;
                               padding:28px 20px;text-align:center;">
                      <div style="width:64px;height:64px;background:${C.orange};
                                  background:linear-gradient(135deg,${C.orange},${C.orangeRed});
                                  border-radius:50%;margin:0 auto 12px;line-height:64px;
                                  text-align:center;font-size:26px;
                                  border:2px solid ${C.orange};">
                        ▶
                      </div>
                      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${C.fg};">
                        Guarda il video del consulente
                      </p>
                      <p style="margin:0;font-size:11px;color:${C.muted};">
                        Spiega tutto sul tuo prodotto in 30 secondi
                      </p>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ""}

    <!-- BENEFITS -->
    <tr>
      <td style="background:${C.cardDeep};padding:24px 28px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.18em;
                  text-transform:uppercase;color:${C.muted};text-align:center;">
          INCLUSO NEL TUO PACCHETTO
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="33%" style="text-align:center;padding:0 8px;border-right:1px solid ${C.border};">
              <p style="margin:0 0 4px;font-size:22px;">🎥</p>
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${C.fg};">Video 30s</p>
              <p style="margin:0;font-size:10px;color:${C.muted};">Il consulente spiega tutto</p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;border-right:1px solid ${C.border};">
              <p style="margin:0 0 4px;font-size:22px;">📖</p>
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${C.fg};">Manuale PDF</p>
              <p style="margin:0;font-size:10px;color:${C.muted};">Guia passo-passo</p>
            </td>
            <td width="33%" style="text-align:center;padding:0 8px;">
              <p style="margin:0 0 4px;font-size:22px;">💰</p>
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${C.orange};">Sconto VIP</p>
              <p style="margin:0;font-size:10px;color:${C.muted};">Solo per te oggi</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FAQ -->
    ${faq.length > 0 ? `
    <tr>
      <td style="background:${C.card};padding:28px;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.18em;
                  text-transform:uppercase;color:${C.muted};text-align:center;">
          ❓ DOMANDE FREQUENTI
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${faq.map((item, i) => `
          <tr>
            <td style="padding:${i === 0 ? "0" : "12px"} 0 0;">
              ${i > 0 ? `<div style="border-top:1px solid ${C.border};margin-bottom:12px;"></div>` : ""}
              <p style="margin:0 0 5px;font-size:13px;font-weight:700;color:${C.fg};">
                ❓ ${item.q}
              </p>
              <p style="margin:0;font-size:12px;color:${C.muted};line-height:1.6;">
                ${item.a}
              </p>
            </td>
          </tr>`).join("")}
        </table>
      </td>
    </tr>` : ""}

    <!-- SPAM NOTE -->
    <tr>
      <td style="background:${C.bg};padding:12px 28px;text-align:center;
                 border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
        <p style="margin:0;font-size:11px;color:${C.muted};">
          📬 Non vedi l'email? Controlla la cartella <strong>spam</strong> o <strong>promozioni</strong>.
        </p>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:${C.cardDeep};padding:24px 28px;text-align:center;
                 border-radius:0 0 24px 24px;border:1px solid ${C.border};border-top:none;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${C.fg};letter-spacing:0.08em;">
          WEBIDOO STORE
        </p>
        ${fullName
          ? `<p style="margin:0 0 8px;font-size:12px;color:${C.muted};">
               Inviato a ${fullName}${data.email ? ` — ${data.email}` : ""}
             </p>`
          : ""
        }
        <p style="margin:0;font-size:10px;color:${C.muted};line-height:1.6;">
          Dati crittografati · Conformità GDPR<br/>
          Ricevi questa email perché hai partecipato a Webi-Match in negozio.<br/>
          Questo codice è valido 24 ore dalla ricezione di questa email.
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`.trim();
}
