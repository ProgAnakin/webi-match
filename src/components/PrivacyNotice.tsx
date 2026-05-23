import { useLang } from "@/i18n/LanguageContext";

// Plain-language GDPR privacy notice shown to the customer before they hand
// over their name and email. Rendered both in a modal on the welcome screen
// and as the standalone /privacy page.
//
// ⚠ This is an accurate, good-faith notice — but it must be reviewed and
// approved by Webidoo's legal/DPO before commercial rollout, and the contact
// address and retention period confirmed.

const CONTACT_EMAIL = "privacy@webidoo.com";

interface Section { h: string; p: string; }
interface NoticeContent { title: string; intro: string; sections: Section[]; }

const IT: NoticeContent = {
  title: "Informativa sulla privacy",
  intro:
    "Webidoo Store tratta i tuoi dati personali nel rispetto del Regolamento (UE) 2016/679 (GDPR). Questa informativa spiega quali dati raccogliamo tramite il quiz in negozio e come li usiamo.",
  sections: [
    { h: "Titolare del trattamento", p: "Webidoo Store è il titolare del trattamento dei dati raccolti tramite questo chiosco." },
    { h: "Dati raccolti", p: "Nome, cognome e indirizzo email. Vengono inoltre registrate le tue risposte al quiz, usate solo per calcolare il prodotto consigliato." },
    { h: "Finalità", p: "Inviarti via email il prodotto consigliato, il relativo codice sconto e le informazioni associate. I dati non vengono usati per altre finalità di marketing senza un ulteriore consenso." },
    { h: "Base giuridica", p: "Il trattamento si basa sul tuo consenso esplicito, prestato spuntando l'apposita casella prima di iniziare." },
    { h: "Conservazione", p: "I dati vengono conservati per il tempo necessario alla finalità indicata e periodicamente eliminati. Puoi richiederne la cancellazione in qualsiasi momento." },
    { h: "Responsabili esterni", p: "I dati sono ospitati su Supabase (infrastruttura) e l'email è inviata tramite Brevo (invio email transazionali), che agiscono come responsabili del trattamento." },
    { h: "I tuoi diritti", p: `Puoi richiedere l'accesso, la rettifica, la cancellazione dei tuoi dati e revocare il consenso in qualsiasi momento scrivendo a ${CONTACT_EMAIL}.` },
  ],
};

const EN: NoticeContent = {
  title: "Privacy Notice",
  intro:
    "Webidoo Store processes your personal data in compliance with Regulation (EU) 2016/679 (GDPR). This notice explains what data we collect through the in-store quiz and how we use it.",
  sections: [
    { h: "Data controller", p: "Webidoo Store is the controller of the data collected through this kiosk." },
    { h: "Data we collect", p: "First name, last name and email address. Your quiz answers are also recorded and used solely to compute the recommended product." },
    { h: "Purpose", p: "To email you the recommended product, its discount code and the related information. The data is not used for other marketing purposes without further consent." },
    { h: "Legal basis", p: "Processing is based on your explicit consent, given by ticking the box before you start." },
    { h: "Retention", p: "Data is kept only as long as needed for the stated purpose and is purged periodically. You may request deletion at any time." },
    { h: "Processors", p: "Data is hosted on Supabase (infrastructure) and email is sent via Brevo (transactional email); both act as data processors." },
    { h: "Your rights", p: `You may request access, rectification or deletion of your data, and withdraw consent at any time, by writing to ${CONTACT_EMAIL}.` },
  ],
};

export const PrivacyNotice = () => {
  const { lang } = useLang();
  const c = lang === "it" ? IT : EN;

  return (
    <div className="space-y-4 text-left">
      <h1 className="text-lg font-bold text-foreground">{c.title}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{c.intro}</p>
      <div className="space-y-3">
        {c.sections.map((s) => (
          <div key={s.h}>
            <h2 className="text-sm font-semibold text-foreground">{s.h}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
