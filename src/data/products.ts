// Match percentage bounds — avoids demoralizing scores (<45%) and unrealistic perfect scores (100%).
// 98% cap preserves the sense that there's always a "better" match to explore.
const MATCH_MIN = 45;
const MATCH_MAX = 98;

export interface Product {
  id: string;
  name: string;
  image: string;
  price: string;
  rating: number;
  description: string;
  videoUrl: string;
  tags: string[];
  faq: { q: string; a: string }[];
}

// ⚠️ Verifica i prezzi prima del deploy in produzione
export const products: Product[] = [
  {
    id: "blnd-blender",
    name: "BLND Blender Portatile",
    image: "/products/blnd-blender.png",
    price: "€49,00",
    rating: 4.6,
    description: "Frullatore portatile senza fili con motore ad alta velocità e lame in acciaio inox. Frulla frutta fresca e cubetti di ghiaccio, ricarica via USB-C, fino a 15 cicli per carica.",
    videoUrl: "#",
    tags: ["sport", "wellness", "travel"],
    faq: [
      { q: "Può frullare il ghiaccio?", a: "Sì, le lame in acciaio inox triturano cubetti di ghiaccio e frutta congelata senza problemi." },
      { q: "Come si ricarica?", a: "Via cavo USB-C — puoi ricaricarlo in auto, in ufficio o con qualsiasi power bank." },
      { q: "Quante frullate fa con una carica?", a: "Fino a 15 cicli completi per carica, sufficienti per più giorni di utilizzo." },
    ],
  },
  {
    id: "fitring-air",
    name: "FitRing Air – Anello Smart",
    image: "/products/fitring-air.png",
    price: "€79,00",
    rating: 4.7,
    description: "Anello smart ultrasottile con monitoraggio continuo di frequenza cardiaca, SpO2 e qualità del sonno 24/7. Resistente all'acqua 5 ATM e fino a 7 giorni di autonomia.",
    videoUrl: "#",
    tags: ["sport", "tech", "recovery"],
    faq: [
      { q: "Si può indossare in piscina?", a: "Sì, resistenza 5 ATM — nuoto, doccia e mare senza problemi." },
      { q: "Monitora il sonno?", a: "Sì, rileva le fasi del sonno ogni notte e ti mostra un punteggio di recupero." },
      { q: "Quanto dura la batteria?", a: "Fino a 7 giorni con utilizzo normale, si ricarica in circa un'ora." },
    ],
  },
  {
    id: "head-hdtw01",
    name: "HEAD HDTW01 – Conduzione Ossea",
    image: "/products/head-hdtw01.png",
    price: "€119,00",
    rating: 4.7,
    description: "Auricolari a conduzione ossea impermeabili IPX8 con 32GB di memoria interna. Trasmettono il suono attraverso le ossa lasciando le orecchie libere. Ideali per nuoto e sport all'aperto.",
    videoUrl: "#",
    tags: ["audio", "sport", "travel"],
    faq: [
      { q: "Si possono usare nuotando?", a: "Sì, certificazione IPX8 — funzionano perfettamente sott'acqua." },
      { q: "Serve lo smartphone?", a: "No, 32GB di memoria interna per caricare migliaia di brani e usarli in autonomia." },
      { q: "Le orecchie restano libere?", a: "Sì, la conduzione ossea trasmette il suono attraverso le zigomi — le orecchie rimangono completamente aperte." },
    ],
  },
  {
    id: "ksix-saturn",
    name: "Ksix Anello Saturn Smart",
    image: "/products/ksix-saturn.png",
    price: "€49,00",
    rating: 4.5,
    description: "Anello smart con sensori integrati per frequenza cardiaca, ossigeno nel sangue e qualità del sonno. Si sincronizza con l'app KSIX Ring, resistente 5 ATM, batteria fino a 3 giorni.",
    videoUrl: "#",
    tags: ["tech", "productivity", "recovery"],
    faq: [
      { q: "Con quale app funziona?", a: "Con l'app KSIX Ring, disponibile su iOS e Android — visualizza tutti i tuoi dati in tempo reale." },
      { q: "È resistente all'acqua?", a: "Sì, certificazione 5 ATM — puoi tenerlo anche in piscina e sotto la doccia." },
      { q: "Quanto dura la batteria?", a: "Fino a 3 giorni di utilizzo, con ricarica magnetica rapida." },
    ],
  },
  {
    id: "laifen-neo",
    name: "Laifen NEO – Asciugacapelli",
    image: "/products/laifen-neo.png",
    price: "€69,00",
    rating: 4.8,
    description: "Asciugacapelli ad alta velocità con motore brushless da 110.000 RPM e 200 milioni di ioni negativi. Controllo intelligente della temperatura, ultra-leggero (390g) e silenzioso (59dB).",
    videoUrl: "#",
    tags: ["style", "wellness", "productivity"],
    faq: [
      { q: "Asciuga davvero più veloce?", a: "Sì, il motore a 110.000 RPM riduce i tempi di asciugatura del 30% rispetto ai modelli tradizionali." },
      { q: "Danneggia i capelli?", a: "No, il controllo intelligente della temperatura previene il surriscaldamento; gli ioni negativi riducono il crespo e aumentano il brillo." },
      { q: "È adatto ai viaggi?", a: "Sì, ultra-leggero e silenzioso — perfetto in hotel e appartamenti vacanza." },
    ],
  },
  {
    id: "muzen-otr",
    name: "MUZEN OTR Metal Speaker",
    image: "/products/muzen-otr.png",
    price: "€59,00",
    rating: 4.6,
    description: "Cassa Bluetooth portatile in metallo con design retro e radio FM integrata. Connessione rapida con smartphone e tablet, suono di qualità ovunque tu voglia portarla.",
    videoUrl: "#",
    tags: ["audio", "style", "travel"],
    faq: [
      { q: "Ha davvero la radio FM?", a: "Sì, sintonizzazione FM integrata — musica anche senza smartphone o connessione internet." },
      { q: "È resistente agli urti?", a: "La scocca in metallo pieno la protegge da cadute e graffi quotidiani." },
      { q: "Quanto dura la batteria?", a: "Fino a 6 ore di riproduzione continua a volume medio." },
    ],
  },
  {
    id: "outin-nano",
    name: "Outin Nano – Macchina da Caffè",
    image: "/products/outin-nano.png",
    price: "€129,00",
    rating: 4.8,
    description: "Macchina da espresso portatile con 20 bar di pressione e riscaldamento in 200 secondi. Compatibile con capsule e caffè macinato, batteria da 7.500mAh per più espressi in viaggio.",
    videoUrl: "#",
    tags: ["travel", "productivity", "wellness"],
    faq: [
      { q: "Quanti caffè fa con una carica?", a: "La batteria da 7.500mAh permette di preparare più espressi consecutivi prima di dover ricaricare." },
      { q: "Funziona con le capsule?", a: "Sì, compatibile con capsule Nespresso e con caffè macinato — massima libertà di scelta." },
      { q: "Il caffè è buono come al bar?", a: "I 20 bar di pressione garantiscono una crema densa e un espresso ricco, paragonabile a una macchina professionale." },
    ],
  },
  {
    id: "terraillon-massager",
    name: "Terraillon – Massaggiatore a Pistola",
    image: "/products/terraillon-massager.png",
    price: "€79,00",
    rating: 4.6,
    description: "Massaggiatore a pistola con 4 testine in silicone e beccuccio caldo/freddo. Allevia le tensioni muscolari, migliora la circolazione e accelera il recupero dopo l'allenamento.",
    videoUrl: "#",
    tags: ["recovery", "sport", "wellness"],
    faq: [
      { q: "A cosa serve il beccuccio caldo/freddo?", a: "Il calore prepara i muscoli prima dell'allenamento; il freddo riduce l'infiammazione e accelera il recupero dopo." },
      { q: "È rumoroso?", a: "No, il motore è progettato per un funzionamento silenzioso, adatto anche in ambienti condivisi." },
      { q: "Quante testine include?", a: "4 testine in silicone intercambiabili per trattare diverse zone corporee con la giusta intensità." },
    ],
  },
  {
    id: "veho-pebble-mg5",
    name: "Veho Pebble MG5 MagSafe",
    image: "/products/veho-pebble-mg5.png",
    price: "€49,00",
    rating: 4.7,
    description: "Power bank MagSafe ultrasottile (8,3mm) da 5.000mAh con ricarica magnetica wireless e porta USB-C PD per ricarica rapida via cavo. Attacca, ricarica, vai.",
    videoUrl: "#",
    tags: ["travel", "productivity", "tech"],
    faq: [
      { q: "Funziona con tutti gli iPhone?", a: "Sì, compatibile con iPhone 12 e successivi tramite connessione magnetica MagSafe." },
      { q: "Quanto è sottile?", a: "Solo 8,3mm — spesso quanto una matita. Si aggiunge al telefono senza ingombrare." },
      { q: "Si può usare anche con il cavo?", a: "Sì, la porta USB-C PD integrata permette la ricarica rapida anche via cavo con qualsiasi dispositivo." },
    ],
  },
  {
    id: "veho-zb7",
    name: "Veho ZB-7 – Cuffie Wireless ANC",
    image: "/products/veho-zb7.png",
    price: "€59,00",
    rating: 4.7,
    description: "Cuffie over-ear wireless con cancellazione attiva del rumore (ANC), driver da 40mm, 32 ore di autonomia e Bluetooth 5.0. Padiglioni ultra-morbidi per un ascolto confortevole tutto il giorno.",
    videoUrl: "#",
    tags: ["audio", "productivity", "style"],
    faq: [
      { q: "L'ANC funziona bene?", a: "Sì, elimina efficacemente i rumori di fondo come uffici aperti, mezzi di trasporto e ambienti affollati." },
      { q: "Quanto dura la batteria?", a: "32 ore di riproduzione continua — più di un giorno intero senza ricaricare." },
      { q: "Ha il microfono per le chiamate?", a: "Sì, microfono integrato per chiamate mani libere chiare e senza disturbi." },
    ],
  },
];
// Maps questionId → product tag (must stay in sync with questions.ts categories)
// Winning scenario per product (all verified to be unique):
//   BLND Blender      → sport + wellness + travel
//   FitRing Air       → sport + tech + recovery
//   HEAD HDTW01       → audio + sport + travel
//   Ksix Saturn       → tech + productivity + recovery
//   Laifen NEO        → style + wellness + productivity
//   MUZEN OTR         → audio + style + travel
//   Outin Nano        → travel + productivity + wellness
//   Terraillon        → recovery + sport + wellness
//   Veho Pebble MG5   → travel + productivity + tech
//   Veho ZB-7         → audio + productivity + style
const TAG_MAP: Record<number, string> = {
  1: "sport",
  2: "audio",
  3: "productivity",
  4: "wellness",
  5: "travel",
  6: "tech",
  7: "style",
  8: "recovery",
};

/**
 * Returns the best-matching product for a set of quiz answers.
 * @param answers       Map of questionId → boolean (yes/no)
 * @param activeIds     Optional set of active product IDs from Supabase.
 *                      When provided, only products in the set are considered.
 *                      Falls back to the full catalogue if the set is empty or undefined.
 */
export function getMatchedProduct(
  answers: Record<number, boolean>,
  activeIds?: Set<string>,
): { product: Product; matchPercent: number } {
  // Use only active products; fall back to full catalogue if none are configured
  // or if the filtered set is empty (e.g. Supabase has stale/outdated product IDs).
  const filtered =
    activeIds && activeIds.size > 0
      ? products.filter((p) => activeIds.has(p.id))
      : products;
  const pool = filtered.length > 0 ? filtered : products;

  const activeTags: string[] = [];
  Object.entries(answers).forEach(([qId, answered]) => {
    if (answered && TAG_MAP[Number(qId)]) activeTags.push(TAG_MAP[Number(qId)]);
  });

  let bestScore = 0;
  const tied: Product[] = [];

  pool.forEach((product) => {
    const score = product.tags.filter((tag) => activeTags.includes(tag)).length;
    if (score > bestScore) {
      bestScore = score;
      tied.length = 0;
      tied.push(product);
    } else if (score === bestScore) {
      tied.push(product);
    }
  });

  // Pick randomly among tied products so different users see variety.
  // Fallback to pool[0] then products[0] to guarantee a non-null result.
  const bestProduct = tied[Math.floor(Math.random() * tied.length)] ?? pool[0] ?? products[0];

  const totalTags = activeTags.length || 1;
  const rawPercent = Math.round((bestScore / totalTags) * 100);
  const matchPercent = Math.min(MATCH_MAX, Math.max(MATCH_MIN, rawPercent));

  return { product: bestProduct, matchPercent };
}
