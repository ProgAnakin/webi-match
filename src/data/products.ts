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
    id: "outin-nano",
    name: "OutIn Nano – Macchina da Caffè Portatile",
    image: "/products/outin-nano.png",
    price: "€139,00",
    rating: 4.8,
    description: "Caffè di qualità ovunque tu sia. Macchina da caffè espresso elettrica portatile con ricarica USB-C, batteria da 7500mAh e pressione a 15 bar per un espresso perfetto in pochi minuti.",
    videoUrl: "#",
    tags: ["travel", "fitness", "wellness"],
    faq: [
      { q: "Quante tazze posso fare con una carica?", a: "Fino a 5 espressi caldi con acqua a temperatura ambiente o oltre 200 con acqua calda." },
      { q: "Funziona con cialde o caffè macinato?", a: "Entrambi! Puoi scegliere il tuo metodo preferito." },
      { q: "Quanto pesa?", a: "Solo 550g — perfetta da portare nello zaino o in valigia." },
    ],
  },
  {
    id: "laifen-se",
    name: "Laifen SE Special – Asciugacapelli",
    image: "/products/laifen-se.png",
    price: "€99,99",
    rating: 4.9,
    description: "Asciugacapelli ad alta velocità con motore brushless da 105.000 giri/min, tecnologia a 200 milioni di ioni negativi e controllo termico intelligente. Solo 407g per un'asciugatura ultra-rapida.",
    videoUrl: "#",
    tags: ["wellness", "productivity", "communication"],
    faq: [
      { q: "È sicuro per capelli fragili?", a: "Sì! Il controllo termico rileva la temperatura 50 volte al secondo per proteggere i capelli." },
      { q: "Cosa include la confezione?", a: "Asciugacapelli + ugello standard magnetico + ugello diffusore magnetico + manuale." },
      { q: "Quanto è rumoroso?", a: "Solo 59 decibel — molto silenzioso rispetto agli asciugacapelli tradizionali." },
    ],
  },
  {
    id: "smartwatch-pro",
    name: "SmartWatch Pro X – Orologio Sportivo",
    image: "/products/placeholder-product.png",
    price: "€199,00",
    rating: 4.7,
    description: "Orologio sportivo con GPS integrato, cardiofrequenzimetro, 50+ modalità sport e batteria fino a 14 giorni. Resistente all'acqua fino a 50 metri.",
    videoUrl: "#",
    tags: ["fitness", "wellness", "communication"],
    faq: [
      { q: "È resistente all'acqua?", a: "Sì, fino a 50 metri di profondità." },
      { q: "Quanti giorni dura la batteria?", a: "Fino a 14 giorni in uso normale." },
      { q: "Funziona con iPhone e Android?", a: "Sì, compatibile con entrambi i sistemi." },
    ],
  },
  {
    id: "cuffie-wireless",
    name: "SoundMax ANC – Cuffie Wireless",
    image: "/products/placeholder-product.png",
    price: "€149,00",
    rating: 4.6,
    description: "Cuffie over-ear con cancellazione attiva del rumore, audio Hi-Res, 40 ore di autonomia e microfoni integrati per chiamate cristalline.",
    videoUrl: "#",
    tags: ["audio", "gaming", "communication"],
    faq: [
      { q: "Quanto dura la batteria?", a: "Fino a 40 ore con ANC attivo." },
      { q: "Supportano il multipoint?", a: "Sì, puoi connetterle a 2 dispositivi contemporaneamente." },
      { q: "Sono comode per lunghe sessioni?", a: "Sì, cuscinetti in memory foam ultra-morbidi." },
    ],
  },
  {
    id: "action-cam",
    name: "ActionVision 4K – Action Camera",
    image: "/products/placeholder-product.png",
    price: "€249,00",
    rating: 4.5,
    description: "Action camera 4K/60fps con stabilizzazione avanzata, impermeabile fino a 10m, grandangolo 170° e schermo touch da 2 pollici.",
    videoUrl: "#",
    tags: ["camera", "travel", "fitness"],
    faq: [
      { q: "È impermeabile?", a: "Sì, fino a 10 metri senza custodia aggiuntiva." },
      { q: "Che risoluzione video supporta?", a: "4K a 60fps o 1080p a 120fps per slow motion." },
      { q: "Ha la stabilizzazione?", a: "Sì, stabilizzazione elettronica avanzata su 6 assi." },
    ],
  },
  {
    id: "tastiera-meccanica",
    name: "KeyForce RGB – Tastiera Meccanica",
    image: "/products/placeholder-product.png",
    price: "€89,00",
    rating: 4.4,
    description: "Tastiera meccanica wireless con switch silenziosi, retroilluminazione RGB personalizzabile, layout compatto 75% e batteria ricaricabile.",
    videoUrl: "#",
    tags: ["gaming", "productivity", "audio"],
    faq: [
      { q: "Funziona via Bluetooth?", a: "Sì, Bluetooth 5.0 + connessione wireless 2.4GHz + cavo USB-C." },
      { q: "I switch sono intercambiabili?", a: "Sì, supporta hot-swap per tutti gli switch meccanici." },
      { q: "È compatibile con Mac?", a: "Sì, compatibile con Windows, Mac e Linux." },
    ],
  },
  {
    id: "lampada-smart",
    name: "LumiDesk Pro – Lampada Smart da Scrivania",
    image: "/products/placeholder-product.png",
    price: "€69,00",
    rating: 4.3,
    description: "Lampada da scrivania LED con temperatura colore regolabile, timer pomodoro integrato, ricarica wireless Qi e controllo tramite app.",
    videoUrl: "#",
    tags: ["productivity", "wellness", "communication"],
    faq: [
      { q: "Ha la ricarica wireless?", a: "Sì, base con ricarica Qi da 15W integrata." },
      { q: "Quanti livelli di luminosità?", a: "5 livelli di luminosità e 4 temperature di colore." },
      { q: "Come si controlla?", a: "Touch sul corpo, app dedicata o assistente vocale." },
    ],
  },
  {
    id: "drone-mini",
    name: "SkyLite Mini – Drone Compatto",
    image: "/products/placeholder-product.png",
    price: "€299,00",
    rating: 4.7,
    description: "Drone ultraleggero da 249g con camera 4K, gimbal a 3 assi, autonomia di 30 minuti e modalità seguimi automatica.",
    videoUrl: "#",
    tags: ["camera", "travel", "gaming"],
    faq: [
      { q: "Serve il patentino?", a: "No, pesa meno di 250g quindi non è richiesto in molti paesi EU." },
      { q: "Quanto dura il volo?", a: "Fino a 30 minuti con una singola carica." },
      { q: "Ha la modalità seguimi?", a: "Sì, tracciamento intelligente del soggetto con AI." },
    ],
  },
  {
    id: "speaker-portatile",
    name: "BassWave 360 – Speaker Portatile",
    image: "/products/placeholder-product.png",
    price: "€79,00",
    rating: 4.5,
    description: "Speaker Bluetooth portatile con suono a 360°, bassi profondi, impermeabilità IP67, 20 ore di autonomia e possibilità di accoppiamento stereo.",
    videoUrl: "#",
    tags: ["audio", "travel", "fitness"],
    faq: [
      { q: "È impermeabile?", a: "Sì, certificazione IP67 — resiste a polvere e immersione." },
      { q: "Posso accoppiare due speaker?", a: "Sì, modalità stereo con due BassWave 360." },
      { q: "Quanto dura la batteria?", a: "Fino a 20 ore di riproduzione continua." },
    ],
  },
  {
    id: "ring-tracker",
    name: "VitalRing – Anello Smart Tracker",
    image: "/products/placeholder-product.png",
    price: "€179,00",
    rating: 4.6,
    description: "Anello smart in titanio con monitoraggio sonno, frequenza cardiaca, SpO2 e temperatura corporea. Batteria fino a 7 giorni, impermeabile IP68.",
    videoUrl: "#",
    tags: ["fitness", "wellness", "productivity"],
    faq: [
      { q: "Come si sceglie la taglia?", a: "Kit di misurazione gratuito incluso nell'ordine." },
      { q: "Monitora il sonno?", a: "Sì, fasi del sonno, qualità e punteggio giornaliero." },
      { q: "È resistente all'acqua?", a: "Sì, IP68 — puoi usarlo sotto la doccia e in piscina." },
    ],
  },
];
export function getMatchedProduct(answers: Record<number, boolean>): { product: Product; matchPercent: number } {
  const activeTags: string[] = [];
  const tagMap: Record<number, string> = {
    1: "fitness",
    2: "audio",
    3: "productivity",
    4: "camera",
    5: "travel",
    6: "gaming",
    7: "communication",
    8: "wellness",
  };

  Object.entries(answers).forEach(([qId, answered]) => {
    if (answered && tagMap[Number(qId)]) {
      activeTags.push(tagMap[Number(qId)]);
    }
  });

  let bestProduct = products[0];
  let bestScore = 0;

  products.forEach((product) => {
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
