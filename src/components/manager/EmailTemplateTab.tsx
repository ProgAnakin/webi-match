import { useState, useEffect, useCallback } from "react";
import { Check, Clock, Eye, EyeOff, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TTL_STORAGE_KEY = "wm_code_ttl_hours";
const TTL_OPTIONS = [6, 12, 24, 48, 72] as const;
type TtlOption = typeof TTL_OPTIONS[number];

export function getCodeTtlMs(): number {
  try {
    const v = localStorage.getItem(TTL_STORAGE_KEY);
    const hours = v ? parseInt(v, 10) : 24;
    return (Number.isFinite(hours) ? hours : 24) * 3_600_000;
  } catch { return 24 * 3_600_000; }
}

const SUPPORTED_LANGS = ["it", "en", "fr", "es", "pt"] as const;
type Lang = typeof SUPPORTED_LANGS[number];

const LANG_META: Record<Lang, { flag: string; label: string }> = {
  it: { flag: "🇮🇹", label: "Italiano" },
  en: { flag: "🇬🇧", label: "English" },
  fr: { flag: "🇫🇷", label: "Français" },
  es: { flag: "🇪🇸", label: "Español" },
  pt: { flag: "🇵🇹", label: "Português" },
};

interface EmailTemplate {
  sender_name: string;
  subject_template: string;
  header_title: string;
  header_subtitle: string;
  footer_store_name: string;
}

const DEFAULTS_BY_LANG: Record<Lang, EmailTemplate> = {
  it: {
    sender_name: "Costanzo Annichini",
    subject_template: "{{nome}}, il tuo match è {{pct}}% — Codice sconto valido 24h ⏰",
    header_title: "Abbiamo trovato il tuo match!",
    header_subtitle: "Il nostro algoritmo ha analizzato le tue risposte e ha selezionato il gadget perfetto per il tuo stile di vita.",
    footer_store_name: "COSTANZO ANNICHINI",
  },
  en: {
    sender_name: "Costanzo Annichini",
    subject_template: "{{nome}}, your match is {{pct}}% — Discount code valid 24h ⏰",
    header_title: "We found your match!",
    header_subtitle: "Our algorithm analysed your answers and selected the perfect gadget for your lifestyle.",
    footer_store_name: "COSTANZO ANNICHINI",
  },
  fr: {
    sender_name: "Costanzo Annichini",
    subject_template: "{{nome}}, votre match est de {{pct}}% — Code de réduction valable 24h ⏰",
    header_title: "Nous avons trouvé votre match !",
    header_subtitle: "Notre algorithme a analysé vos réponses et a sélectionné le gadget parfait pour votre style de vie.",
    footer_store_name: "COSTANZO ANNICHINI",
  },
  es: {
    sender_name: "Costanzo Annichini",
    subject_template: "{{nome}}, tu match es {{pct}}% — Código de descuento válido 24h ⏰",
    header_title: "¡Encontramos tu match!",
    header_subtitle: "Nuestro algoritmo analizó tus respuestas y seleccionó el gadget perfecto para tu estilo de vida.",
    footer_store_name: "COSTANZO ANNICHINI",
  },
  pt: {
    sender_name: "Costanzo Annichini",
    subject_template: "{{nome}}, o seu match é {{pct}}% — Código de desconto válido 24h ⏰",
    header_title: "Encontrámos o seu match!",
    header_subtitle: "O nosso algoritmo analisou as suas respostas e selecionou o gadget perfeito para o seu estilo de vida.",
    footer_store_name: "COSTANZO ANNICHINI",
  },
};

const SAMPLE = { nome: "Marco", pct: "87", product: "Sony WH-1000XM5", price: "€349,00", code: "WEBI-A3F2B187" };

function interpolate(tpl: string): string {
  return tpl.replace(/\{\{nome\}\}/g, SAMPLE.nome).replace(/\{\{pct\}\}/g, SAMPLE.pct);
}

const FIELD_META: { key: keyof EmailTemplate; label: string; hint: string; multiline?: boolean }[] = [
  {
    key: "sender_name",
    label: "Nome mittente",
    hint: 'Apparirà come "Da: Nome mittente" nella casella del cliente.',
  },
  {
    key: "subject_template",
    label: "Oggetto email",
    hint: "Variabili disponibili: {{nome}} → nome cliente, {{pct}} → percentuale match.",
    multiline: true,
  },
  {
    key: "header_title",
    label: "Titolo header",
    hint: 'Grande titolo in cima all\'email. Es: "We found your match!"',
    multiline: true,
  },
  {
    key: "header_subtitle",
    label: "Sottotitolo header",
    hint: "Paragrafo descrittivo sotto il titolo.",
    multiline: true,
  },
  {
    key: "footer_store_name",
    label: "Nome store nel footer",
    hint: "Mostrato in fondo all'email e sulla card del codice sconto.",
  },
];

function EmailPreview({ form }: { form: EmailTemplate }) {
  return (
    <div className="rounded-2xl border border-border bg-[#0d1228] overflow-hidden text-[#f0f4ff] font-sans">
      <div className="h-1 w-full bg-gradient-to-r from-[#f5831c] via-[#e8420a] to-[#f5831c]" />
      <div className="bg-[#101628] px-6 py-5 text-center space-y-2">
        <div className="inline-block rounded-lg bg-gradient-to-r from-[#f5831c] to-[#e8420a] px-4 py-1.5">
          <span className="text-[11px] font-black tracking-widest text-white uppercase">WEBI·MATCH</span>
        </div>
        <p className="text-base font-bold leading-snug">
          Ciao <span className="text-[#f5831c]">{SAMPLE.nome}</span>,{" "}
          <span>{interpolate(form.header_title)}</span>
        </p>
        <p className="text-xs text-[#7a8fbb] leading-relaxed">{interpolate(form.header_subtitle)}</p>
      </div>
      <div className="bg-[#151d47] px-6 py-5 text-center border-t border-[#2a3a68]">
        <p className="text-5xl font-black text-[#6BCB77]">{SAMPLE.pct}<span className="text-2xl">%</span></p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a8fbb] mt-1">Compatibilità</p>
        <div className="mt-2 inline-block rounded-full border border-[#6BCB77]/40 bg-[#6BCB77]/10 px-3 py-1">
          <span className="text-[10px] font-bold text-[#6BCB77]">OTTIMO MATCH</span>
        </div>
      </div>
      <div className="bg-[#151d47] px-6 py-4 border-t border-[#2a3a68]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a8fbb] text-center mb-2">── IL TUO GADGET IDEALE ──</p>
        <div className="rounded-xl border border-[#2a3a68] bg-[#101628] h-20 flex items-center justify-center text-3xl mb-3">📦</div>
        <p className="text-sm font-black">{SAMPLE.product}</p>
        <p className="text-lg font-bold text-[#f5831c]">{SAMPLE.price}</p>
      </div>
      <div className="bg-[#151d47] px-6 py-4 border-t border-[#2a3a68] text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a8fbb] mb-2">IL TUO CODICE SCONTO</p>
        <div className="rounded-xl border-2 border-[#f5831c] overflow-hidden">
          <div className="bg-gradient-to-r from-[#f5831c] to-[#e8420a] px-4 py-2 flex justify-between">
            <span className="text-[10px] font-black text-white uppercase">Sconto Speciale</span>
            <span className="text-[9px] text-white/70">{form.footer_store_name}</span>
          </div>
          <div className="bg-[#101628] px-4 py-4">
            <p className="text-2xl font-black font-mono tracking-wider">{SAMPLE.code}</p>
            <div className="flex justify-center gap-2 mt-2">
              <span className="rounded-full bg-[#f5831c] px-2 py-0.5 text-[9px] font-bold text-white">✓ 24 ore</span>
              <span className="rounded-full border border-[#2a3a68] px-2 py-0.5 text-[9px] text-[#f0f4ff]">🏪 In negozio</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#101628] px-6 py-4 text-center border-t border-[#2a3a68]">
        <p className="text-xs font-black">{form.footer_store_name}</p>
        <p className="text-[10px] text-[#7a8fbb]">Powered by Webi-Match</p>
        <p className="text-[9px] text-[#7a8fbb] mt-1">
          Inviato a <strong className="text-[#f0f4ff]">{SAMPLE.nome}</strong> · Da: {form.sender_name}
        </p>
      </div>
    </div>
  );
}

export function EmailTemplateTab() {
  const [forms, setForms] = useState<Record<Lang, EmailTemplate>>(
    () => ({ ...DEFAULTS_BY_LANG })
  );
  const [activeLang, setActiveLang] = useState<Lang>("it");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [codeTtl, setCodeTtl] = useState<TtlOption>(() => {
    try {
      const v = localStorage.getItem(TTL_STORAGE_KEY);
      const h = v ? parseInt(v, 10) : 24;
      return (TTL_OPTIONS.includes(h as TtlOption) ? h : 24) as TtlOption;
    } catch { return 24; }
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_template")
      .select("language, sender_name, subject_template, header_title, header_subtitle, footer_store_name");
    if (data && data.length > 0) {
      setForms((prev) => {
        const next = { ...prev };
        for (const row of data) {
          const lang = row.language as Lang;
          if (SUPPORTED_LANGS.includes(lang)) {
            next[lang] = {
              sender_name: row.sender_name,
              subject_template: row.subject_template,
              header_title: row.header_title,
              header_subtitle: row.header_subtitle,
              footer_store_name: row.footer_store_name,
            };
          }
        }
        return next;
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const form = forms[activeLang];
  const setForm = (updater: (f: EmailTemplate) => EmailTemplate) => {
    setForms((prev) => ({ ...prev, [activeLang]: updater(prev[activeLang]) }));
  };

  const saveTemplate = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("email_template")
      .update({ ...forms[activeLang], updated_at: new Date().toISOString() })
      .eq("language", activeLang);
    if (err) {
      setError(err.message);
      toast.error("Errore nel salvataggio template.");
    } else {
      try { localStorage.setItem(TTL_STORAGE_KEY, String(codeTtl)); } catch { /* ignore */ }
      setSaved(true);
      toast.success(`Template ${LANG_META[activeLang].flag} salvato.`);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Template Email</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Un template per ogni lingua — seleziona e modifica.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold active:scale-95 transition-colors ${
              showPreview
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {showPreview ? <><EyeOff className="h-3 w-3" /> Modifica</> : <><Eye className="h-3 w-3" /> Anteprima</>}
          </button>
          <button
            onClick={() => setForms((prev) => ({ ...prev, [activeLang]: DEFAULTS_BY_LANG[activeLang] }))}
            className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
          >
            <RotateCcw className="h-3 w-3" /> Default
          </button>
          <button
            onClick={saveTemplate}
            disabled={saving || loading}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95 disabled:opacity-60"
          >
            {saved ? <><Check className="h-3 w-3" /> Salvato!</> : <><Save className="h-3 w-3" /> {saving ? "Salvataggio…" : "Salva"}</>}
          </button>
        </div>
      </div>

      {/* Language selector */}
      <div className="flex gap-2 flex-wrap">
        {SUPPORTED_LANGS.map((lang) => (
          <button
            key={lang}
            onClick={() => { setActiveLang(lang); setSaved(false); }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors active:scale-95 ${
              activeLang === lang
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span>{LANG_META[lang].flag}</span>
            <span>{LANG_META[lang].label}</span>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        💡 Le modifiche vengono usate dalla prossima email inviata — nessun deploy necessario.
        Ogni lingua ha il proprio template; l'email inviata al cliente usa la lingua scelta durante il quiz.
      </div>

      {showPreview ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Anteprima oggetto · {LANG_META[activeLang].flag} {LANG_META[activeLang].label}
            </p>
            <p className="text-sm font-semibold text-foreground">{interpolate(form.subject_template)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Da: {form.sender_name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Anteprima con dati di esempio — {SAMPLE.nome}, {SAMPLE.pct}%, {SAMPLE.product}
          </p>
          <EmailPreview form={form} />
        </div>
      ) : (
        loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Caricamento template…</div>
        ) : (
          <div className="space-y-4">
            {FIELD_META.map(({ key, label, hint, multiline }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <label className="block text-xs font-semibold text-foreground">{label}</label>
                <p className="text-[10px] text-muted-foreground">{hint}</p>
                {multiline ? (
                  <textarea
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
            ))}
          </div>
        )
      )}

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {/* Discount code TTL */}
      {!showPreview && (
        <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Validità codice sconto
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Durata visualizzata nell'email e nel pannello sessioni. Il codice viene considerato scaduto dopo questo periodo.
          </p>
          <div className="flex flex-wrap gap-2">
            {TTL_OPTIONS.map((h) => (
              <button
                key={h}
                onClick={() => setCodeTtl(h)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  codeTtl === h ? "bg-primary text-primary-foreground" : "border border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            Salvato localmente — viene applicato al prossimo salvataggio del template.
          </p>
        </div>
      )}

      {/* Variable reference */}
      {!showPreview && (
        <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Variabili disponibili nell'oggetto
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { v: "{{nome}}", desc: "Nome cliente" },
              { v: "{{pct}}", desc: "% compatibilità" },
            ].map(({ v, desc }) => (
              <div key={v} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5">
                <code className="text-[10px] font-mono text-primary">{v}</code>
                <span className="text-[10px] text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
