import { useState, useMemo } from "react";
import { buildEmailHtml } from "@/lib/emailTemplate";

const MATCH_TIERS = [
  { min: 0,  label: "<65% Blu",     color: "#4D96FF" },
  { min: 65, label: "≥65% Coral",   color: "#FF8066" },
  { min: 80, label: "≥80% Giallo",  color: "#FFD93D" },
  { min: 90, label: "≥90% Verde",   color: "#6BCB77" },
];

function getMatchColor(pct: number): string {
  for (let i = MATCH_TIERS.length - 1; i >= 0; i--) {
    if (pct >= MATCH_TIERS[i].min) return MATCH_TIERS[i].color;
  }
  return MATCH_TIERS[0].color;
}

const DEFAULT_FAQ = [
  { q: "La batteria dura quanto tempo?", a: "Fino a 8 ore di utilizzo continuo con una singola carica." },
  { q: "È compatibile con iPhone?",      a: "Sì, compatibile con tutti i dispositivi tramite Bluetooth 5.0." },
  { q: "È inclusa la garanzia?",         a: "2 anni di garanzia ufficiale con assistenza dedicata." },
];

export default function EmailPreview() {
  const [nome,         setNome]         = useState("Marco");
  const [cognome,      setCognome]      = useState("Rossi");
  const [email,        setEmail]        = useState("marco.rossi@example.com");
  const [matchPercent, setMatchPercent] = useState(87);
  const [productName,  setProductName]  = useState("BLND Portable Blender");
  const [productPrice, setProductPrice] = useState("€39.00");
  const [productImage, setProductImage] = useState("");
  const [productVideo, setProductVideo] = useState("");
  const [discountCode,    setDiscountCode]    = useState("WEBI-A4F205");
  const [discountPercent, setDiscountPercent] = useState<5 | 8 | 10>(5);
  const [faq, setFaq] = useState(DEFAULT_FAQ);

  const html = useMemo(() => buildEmailHtml({
    nome, cognome, email,
    match_percent:    matchPercent,
    product_name:     productName,
    product_price:    productPrice,
    product_image:    productImage,
    product_video:    productVideo,
    discount_code:    discountCode,
    discount_percent: discountPercent,
    faq,
  }), [nome, cognome, email, matchPercent, productName, productPrice,
      productImage, productVideo, discountCode, discountPercent, faq]);

  const updateFaq = (i: number, field: "q" | "a", val: string) =>
    setFaq(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const ringColor = getMatchColor(matchPercent);

  return (
    <div className="flex h-screen bg-[#0b0f1e] overflow-hidden">

      {/* ── Controls panel ──────────────────────────────────────────────── */}
      <aside className="w-80 shrink-0 flex flex-col border-r border-white/10 overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Webi-Match</p>
          <h1 className="text-lg font-bold text-white leading-tight">Email Preview</h1>
          <p className="text-[11px] text-white/70 mt-0.5">Edita e vê em tempo real</p>
        </div>

        <div className="flex-1 px-4 py-4 space-y-5">

          {/* CLIENTE */}
          <Section title="👤 Cliente">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nome" value={nome} onChange={setNome} />
              <Field label="Cognome" value={cognome} onChange={setCognome} />
            </div>
            <Field label="Email" value={email} onChange={setEmail} />
          </Section>

          {/* MATCH */}
          <Section title="🎯 Match">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  Percentagem
                </label>
                <span className="text-sm font-bold px-2 py-0.5 rounded-full text-black text-[11px]"
                  style={{ backgroundColor: ringColor }}>
                  {matchPercent}%
                </span>
              </div>
              <input type="range" min={1} max={100} value={matchPercent}
                onChange={(e) => setMatchPercent(Number(e.target.value))}
                style={{ accentColor: ringColor }}
                className="w-full" />
              <div className="flex justify-between text-[9px] text-white/30 mt-1">
                {MATCH_TIERS.map((tier) => (
                  <span key={tier.label} style={{ color: tier.color }}>{tier.label}</span>
                ))}
              </div>
            </div>
          </Section>

          {/* PRODUTO */}
          <Section title="📦 Produto">
            <Field label="Nome" value={productName} onChange={setProductName} />
            <Field label="Preço" placeholder="€349.00" value={productPrice} onChange={setProductPrice} />
            <Field label="Imagem (URL)" placeholder="https://..." value={productImage} onChange={setProductImage} />
            <Field label="Vídeo YouTube (URL)" placeholder="https://youtube.com/watch?v=..." value={productVideo} onChange={setProductVideo} />
          </Section>

          {/* DESCONTO */}
          <Section title="🎁 Desconto">
            <div>
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                % Sconto
              </label>
              <div className="mt-1 flex gap-2">
                {([5, 8, 10] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDiscountPercent(opt);
                      setDiscountCode(`WEBI-A4F2${String(opt).padStart(2, "0")}`);
                    }}
                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                      discountPercent === opt
                        ? "bg-orange-500 text-white"
                        : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {opt}%
                  </button>
                ))}
              </div>
            </div>
            <Field label="Código gerado" value={discountCode} onChange={setDiscountCode} />
          </Section>

          {/* FAQ */}
          <Section title="❓ FAQ (3 perguntas)">
            {faq.map((item, i) => (
              <div key={i} className="space-y-1.5 pb-3 border-b border-white/10 last:border-0 last:pb-0">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                  Pergunta {i + 1}
                </p>
                <textarea
                  value={item.q}
                  onChange={(e) => updateFaq(i, "q", e.target.value)}
                  rows={2}
                  placeholder="Domanda..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2
                             text-xs text-white placeholder:text-white/20 resize-none
                             focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                />
                <textarea
                  value={item.a}
                  onChange={(e) => updateFaq(i, "a", e.target.value)}
                  rows={2}
                  placeholder="Risposta..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2
                             text-xs text-white/70 placeholder:text-white/20 resize-none
                             focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                />
              </div>
            ))}
          </Section>

        </div>

        {/* Copy HTML button */}
        <div className="p-4 border-t border-white/10 bg-[#0f1530]">
          <button
            onClick={() => navigator.clipboard.writeText(html)}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600
                       px-4 py-3 text-sm font-bold text-white shadow-lg
                       hover:from-orange-400 hover:to-orange-500 active:scale-95 transition-all"
          >
            Copiar HTML completo
          </button>
          <p className="text-[10px] text-white/30 text-center mt-2">
            Cola em mail-tester.com para testar em vários clientes
          </p>
        </div>
      </aside>

      {/* ── Preview area ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#111827] px-5 py-3 shrink-0">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5
                          text-[11px] text-white/40 font-mono truncate">
            Para: {email || "—"} · {productName}
          </div>
          <span className="text-[10px] text-white/30 shrink-0">
            {new Date().toLocaleDateString("it-IT")}
          </span>
        </div>

        {/* iframe — sandbox allows popups so YouTube links open in new tab */}
        <iframe
          srcDoc={html}
          title="Email Preview"
          className="flex-1 w-full border-0 bg-white"
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400/80 mb-2">
        {title}
      </p>
      <div className="space-y-2 rounded-xl bg-white/3 border border-white/8 p-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2
                   text-xs text-white placeholder:text-white/20
                   focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
      />
    </div>
  );
}
