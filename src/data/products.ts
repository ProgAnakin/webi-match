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

export const products: Product[] = [
  {
    id: "airpulse-pro",
    name: "AirPulse Pro – Auricolari True Wireless",
    image: "/products/placeholder-product.png",
    price: "€129,00",
    rating: 4.8,
    description: "Auricolari true wireless con cancellazione attiva del rumore, audio spaziale 3D, microfoni AI per chiamate cristalline e 32 ore di autonomia totale con la custodia.",
    videoUrl: "#",
    tags: ["audio", "communication", "fitness"],
    faq: [
      { q: "Sono adatti per lo sport?", a: "Sì! Certificazione IPX5 e fit ergonomico per restare in posizione durante l'allenamento." },
      { q: "Come funziona la cancellazione del rumore?", a: "6 microfoni rilevano e neutralizzano i rumori ambientali in tempo reale." },
      { q: "Quanto dura la batteria?", a: "8 ore negli auricolari + 24 ore nella custodia di ricarica." },
    ],
  },
  {
    id: "fitcore-band",
    name: "FitCore Band – Bracciale Fitness AI",
    image: "/products/placeholder-product.png",
    price: "€89,00",
    rating: 4.7,
    description: "Bracciale fitness con coach AI personalizzato, monitoraggio continuo di frequenza cardiaca, stress, SpO2 e sonno. Display AMOLED da 1,47\" e batteria da 10 giorni.",
    videoUrl: "#",
    tags: ["fitness", "wellness", "productivity"],
    faq: [
      { q: "Il coach AI è davvero personalizzato?", a: "Sì, analizza i tuoi dati nel tempo e suggerisce allenamenti e pause basati sul tuo profilo." },
      { q: "Monitora il nuoto?", a: "Sì, impermeabile 5ATM — perfetto in piscina e al mare." },
      { q: "Funziona senza smartphone?", a: "Sì, registra dati autonomamente per poi sincronizzare con l'app." },
    ],
  },
  {
    id: "flashdeck-mini",
    name: "FlashDeck Mini – Proiettore Portatile",
    image: "/products/placeholder-product.png",
    price: "€229,00",
    rating: 4.6,
    description: "Proiettore portatile con Android TV integrato, 500 lumen, schermo fino a 120\", batteria ricaricabile da 3 ore e speaker Dolby Audio. Gaming, film e presentazioni ovunque.",
    videoUrl: "#",
    tags: ["gaming", "travel", "productivity"],
    faq: [
      { q: "Posso collegare una console?", a: "Sì, porta HDMI + USB-A + USB-C per qualsiasi dispositivo." },
      { q: "Funziona alla luce del giorno?", a: "Meglio in ambienti semi-bui, ma i 500 lumen lo rendono versatile anche di sera all'aperto." },
      { q: "Ha lo streaming integrato?", a: "Sì, Android TV con accesso a Netflix, YouTube, Prime Video e molto altro." },
    ],
  },
  {
    id: "clipcam-360",
    name: "ClipCam 360 – Fotocamera Clip-On",
    image: "/products/placeholder-product.png",
    price: "€159,00",
    rating: 4.5,
    description: "Fotocamera clip-on da agganciare allo smartphone con lente grandangolare 360°, stabilizzatore ottico, registrazione 4K e modalità vlog automatica con AI.",
    videoUrl: "#",
    tags: ["camera", "travel", "communication"],
    faq: [
      { q: "È compatibile con tutti gli smartphone?", a: "Sì, clip universale compatibile con iOS e Android, inclusi modelli con custodia." },
      { q: "Funziona come webcam?", a: "Sì, collegabile via USB-C come webcam HD per videochiamate e streaming." },
      { q: "Cosa fa la modalità vlog AI?", a: "Riconosce il soggetto, regola esposizione e stabilizzazione in automatico." },
    ],
  },
  {
    id: "voicebox-studio",
    name: "VoiceBox Studio – Microfono USB con AI",
    image: "/products/placeholder-product.png",
    price: "€99,00",
    rating: 4.7,
    description: "Microfono condenser USB con riduzione del rumore AI in tempo reale, equalizzatore hardware integrato, LED RGB ambientale e compatibilità con tutti i software di registrazione e streaming.",
    videoUrl: "#",
    tags: ["communication", "gaming", "productivity"],
    faq: [
      { q: "Funziona con PS5 e Xbox?", a: "Sì, plug & play su console, PC, Mac e smartphone via USB-C." },
      { q: "L'AI toglie davvero il rumore?", a: "Sì, elimina vento, tastiera e rumore di fondo in tempo reale senza latenza." },
      { q: "Serve un software dedicato?", a: "No, ma l'app opzionale sblocca effetti voce, equalizzatore e mixer avanzato." },
    ],
  },
  {
    id: "sleeppod-neo",
    name: "SleepPod Neo – Maschera Smart per il Sonno",
    image: "/products/placeholder-product.png",
    price: "€119,00",
    rating: 4.8,
    description: "Maschera per il sonno con speaker integrati, light therapy all'alba, monitoraggio cicli del sonno e guided meditation audio. Zero pressione sugli occhi, materiale in seta biologica.",
    videoUrl: "#",
    tags: ["wellness", "audio", "fitness"],
    faq: [
      { q: "Come funziona la sveglia con light therapy?", a: "Simula un'alba naturale con luce crescente nei 30 minuti prima del risveglio per un risveglio dolce." },
      { q: "Si può usare in aereo?", a: "È il prodotto ideale per i viaggi — batteria da 20 ore e design compatto." },
      { q: "Gli speaker danno fastidio?", a: "No, sono piatti e integrati nel tessuto, non toccano le orecchie." },
    ],
  },
  {
    id: "ergoflow-chair",
    name: "ErgoFlow Smart – Sedia con Sensori Posturali",
    image: "/products/placeholder-product.png",
    price: "€499,00",
    rating: 4.6,
    description: "Sedia ergonomica con sensori posturali intelligenti, feedback vibrazionale per correggere la postura, lombare regolabile, materiale traspirante e app di monitoraggio della salute.",
    videoUrl: "#",
    tags: ["productivity", "wellness", "communication"],
    faq: [
      { q: "Come funzionano i sensori posturali?", a: "Rilevano la posizione della schiena e inviano una leggera vibrazione quando la postura non è corretta." },
      { q: "Si monta facilmente?", a: "Sì, montaggio in 15 minuti con istruzioni video nel QR code della scatola." },
      { q: "È adatta a persone alte?", a: "Regolazione in altezza da 155cm a 195cm con 7 punti di regolazione." },
    ],
  },
  {
    id: "trailcam-pro",
    name: "TrailCam Pro – Action Camera con GPS",
    image: "/products/placeholder-product.png",
    price: "€279,00",
    rating: 4.7,
    description: "Action camera 5K con GPS integrato, tracciamento percorso, resistenza all'acqua fino a 20m, stabilizzazione a 8 assi e batteria da 120 minuti. Ideale per trekking, sci e ciclismo.",
    videoUrl: "#",
    tags: ["camera", "fitness", "travel"],
    faq: [
      { q: "Il GPS funziona offline?", a: "Sì, scarica le mappe in anticipo e traccia il percorso senza connessione." },
      { q: "Posso trasmettere in diretta?", a: "Sì, live streaming su YouTube e Facebook direttamente dall'app." },
      { q: "Quanto dura la batteria filmando in 5K?", a: "Circa 90 minuti in 5K, fino a 150 minuti in 4K." },
    ],
  },
  {
    id: "nexpad-gaming",
    name: "NexPad Ultra – Controller Gaming Wireless",
    image: "/products/placeholder-product.png",
    price: "€79,00",
    rating: 4.5,
    description: "Controller gaming wireless con trigger adattivi, feedback aptico avanzato, batteria da 40 ore, latenza ultra-bassa 2.4GHz e compatibilità multipiattaforma: PC, smartphone, tablet e TV.",
    videoUrl: "#",
    tags: ["gaming", "productivity", "audio"],
    faq: [
      { q: "Funziona su iPhone?", a: "Sì, compatibile via Bluetooth con iOS, Android, Windows e macOS." },
      { q: "I trigger adattivi si possono personalizzare?", a: "Sì, tramite l'app puoi regolare resistenza e profili per ogni gioco." },
      { q: "Ha la ricarica wireless?", a: "Sì, compatibile con caricatori Qi standard oltre al cavo USB-C incluso." },
    ],
  },
  {
    id: "nomad-charger",
    name: "Nomad PowerHub – Stazione di Ricarica Solare",
    image: "/products/placeholder-product.png",
    price: "€189,00",
    rating: 4.9,
    description: "Stazione di ricarica portatile con pannello solare integrato da 20W, batteria da 20.000mAh, 4 porte USB-A, 2 USB-C Power Delivery e presa AC da 100W. Indispensabile in viaggio e all'aperto.",
    videoUrl: "#",
    tags: ["travel", "productivity", "fitness"],
    faq: [
      { q: "In quanto si ricarica con il sole?", a: "In circa 8 ore di sole diretto, o 3 ore via presa elettrica con carica rapida." },
      { q: "Quanti dispositivi ricarica insieme?", a: "Fino a 7 dispositivi simultaneamente — smartphone, laptop, tablet e più." },
      { q: "È impermeabile?", a: "Certificazione IP65 — resistente a pioggia, polvere e urti." },
    ],
  },
];
const TAG_MAP: Record<number, string> = {
  1: "fitness",
  2: "audio",
  3: "productivity",
  4: "camera",
  5: "travel",
  6: "gaming",
  7: "communication",
  8: "wellness",
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
  const pool =
    activeIds && activeIds.size > 0
      ? products.filter((p) => activeIds.has(p.id))
      : products;

  const activeTags: string[] = [];
  Object.entries(answers).forEach(([qId, answered]) => {
    if (answered && TAG_MAP[Number(qId)]) activeTags.push(TAG_MAP[Number(qId)]);
  });

  let bestProduct = pool[0];
  let bestScore = 0;

  pool.forEach((product) => {
    const score = product.tags.filter((tag) => activeTags.includes(tag)).length;
    if (score > bestScore) {
      bestScore = score;
      bestProduct = product;
    }
  });

  const totalTags = activeTags.length || 1;
  const rawPercent = Math.round((bestScore / totalTags) * 100);
  const matchPercent = Math.min(98, Math.max(45, rawPercent));

  return { product: bestProduct, matchPercent };
}
