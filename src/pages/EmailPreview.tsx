import { useState, useMemo } from "react";
import { buildEmailHtml } from "@/lib/emailTemplate";

const DEFAULTS = {
  nome:          "Marco",
  cognome:       "Rossi",
  email:         "marco.rossi@example.com",
  match_percent: 87,
  product_name:  "Sony WH-1000XM5",
  product_price: "€349.00",
  product_image: "",
  product_video: "",
  discount_code: "WEBI-A4F2C9",
};

export default function EmailPreview() {
  const [data, setData] = useState(DEFAULTS);

  const html = useMemo(() => buildEmailHtml(data), [data]);

  const set = (k: keyof typeof DEFAULTS, v: string | number) =>
    setData((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="flex min-h-screen bg-[#0b0f1e]">

      {/* ── Controls panel ─────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-r border-white/10 bg-[#151d47] p-5 flex flex-col gap-4 overflow-y-auto">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3">
            Webi-Match · Email Preview
          </p>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Edita os campos e o preview atualiza em tempo real. O email enviado é
            exatamente este HTML.
          </p>
        </div>

        <hr className="border-white/10" />

        {/* Nome / Cognome */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Nome" value={data.nome}
            onChange={(v) => set("nome", v)} />
          <Field label="Cognome" value={data.cognome}
            onChange={(v) => set("cognome", v)} />
        </div>

        <Field label="Email" value={data.email}
          onChange={(v) => set("email", v)} />

        {/* Match % slider */}
        <div>
          <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
            Match % — <span className="text-orange-400">{data.match_percent}%</span>
          </label>
          <input type="range" min={1} max={100} value={data.match_percent}
            onChange={(e) => set("match_percent", Number(e.target.value))}
            className="mt-1 w-full accent-orange-500" />
          <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
            <span>1% (azul)</span>
            <span>65% (coral)</span>
            <span>80% (amarelo)</span>
            <span>90% (verde)</span>
          </div>
        </div>

        <Field label="Nome do produto" value={data.product_name}
          onChange={(v) => set("product_name", v)} />

        <Field label="Preço" placeholder="€349.00"
          value={data.product_price}
          onChange={(v) => set("product_price", v)} />

        <Field label="URL imagem produto" placeholder="https://..."
          value={data.product_image}
          onChange={(v) => set("product_image", v)} />

        <Field label="URL vídeo YouTube" placeholder="https://youtube.com/watch?v=..."
          value={data.product_video}
          onChange={(v) => set("product_video", v)} />

        <Field label="Código de desconto" value={data.discount_code}
          onChange={(v) => set("discount_code", v)} />

        <hr className="border-white/10" />

        {/* Copy HTML button */}
        <button
          onClick={() => navigator.clipboard.writeText(html)}
          className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white
                     hover:bg-orange-400 active:scale-95 transition-all"
        >
          Copiar HTML
        </button>

        <p className="text-[10px] text-white/30 text-center leading-relaxed">
          Cola o HTML em mail-tester.com ou litmus.com para testar em vários clientes de email
        </p>
      </aside>

      {/* ── Email preview iframe ────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#151d47] px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[11px] text-white/30 font-mono">
            email-preview · {data.email || "sem destinatário"}
          </span>
        </div>

        {/* iframe */}
        <iframe
          srcDoc={html}
          title="Email Preview"
          className="flex-1 w-full border-0"
          sandbox="allow-same-origin"
        />
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2
                   text-sm text-white placeholder:text-white/20
                   focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
      />
    </div>
  );
}
