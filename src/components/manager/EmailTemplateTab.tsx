import { useState, useEffect, useCallback } from "react";
import { Check, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplate {
  sender_name: string;
  subject_template: string;
  header_title: string;
  header_subtitle: string;
  footer_store_name: string;
}

const DEFAULTS: EmailTemplate = {
  sender_name: "Costanzo Annichini",
  subject_template: "{{nome}}, il tuo match è {{pct}}% — Codice sconto valido 24h ⏰",
  header_title: "Abbiamo trovato il tuo match!",
  header_subtitle:
    "Il nostro algoritmo ha analizzato le tue risposte e ha selezionato il gadget perfetto per il tuo stile di vita.",
  footer_store_name: "COSTANZO ANNICHINI",
};

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
    hint: 'Grande titolo in cima all\'email. Esempio: "Abbiamo trovato il tuo match!"',
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

export function EmailTemplateTab() {
  const [form, setForm] = useState<EmailTemplate>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_template")
      .select("sender_name, subject_template, header_title, header_subtitle, footer_store_name")
      .eq("id", 1)
      .maybeSingle();
    if (data) setForm(data as EmailTemplate);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplate(); }, [fetchTemplate]);

  const saveTemplate = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("email_template")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const resetDefaults = () => {
    setForm(DEFAULTS);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Template Email</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalizza il testo dell'email inviata ai clienti dopo il quiz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetDefaults}
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

      {/* Info */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        💡 Le modifiche vengono usate dalla prossima email inviata — non servono deploy.
        La struttura HTML dell'email rimane invariata; solo i testi configurabili qui sono modificabili.
      </div>

      {/* Fields */}
      {loading ? (
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
      )}

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {/* Variable reference */}
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
    </div>
  );
}
