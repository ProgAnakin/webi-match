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
    id: "smartwatch-pro",
    name: "SmartWatch Pro X",
    image: "",
    price: "€249,00",
    rating: 4.8,
    description: "L'orologio intelligente definitivo per chi è sempre in movimento.",
    videoUrl: "#",
    tags: ["fitness", "wellness", "travel"],
    faq: [
      { q: "È resistente all'acqua?", a: "Sì! Fino a 50 metri di profondità." },
      { q: "Quanto dura la batteria?", a: "Fino a 7 giorni con uso normale." },
      { q: "Funziona con iPhone e Android?", a: "Sì, compatibile con entrambi." },
    ],
  },
  {
    id: "earbuds-elite",
    name: "EarBuds Elite ANC",
    image: "",
    price: "€179,00",
    rating: 4.9,
    description: "Suono premium con cancellazione del rumore adattiva.",
    videoUrl: "#",
    tags: ["audio", "communication", "travel"],
    faq: [
      { q: "Ha la cancellazione del rumore?", a: "Sì, ANC adattivo di ultima generazione." },
      { q: "Quanta autonomia ha?", a: "8h di riproduzione + 24h con la custodia." },
      { q: "Sono comodi per l'allenamento?", a: "Sì, design ergonomico con punte intercambiabili." },
    ],
  },
  {
    id: "camera-360",
    name: "ActionCam 360°",
    image: "",
    price: "€349,00",
    rating: 4.7,
    description: "Cattura ogni angolo delle tue avventure in 4K.",
    videoUrl: "#",
    tags: ["camera", "travel", "fitness"],
    faq: [
      { q: "Registra in 4K?", a: "Sì, fino a 4K a 60fps con stabilizzazione." },
      { q: "È impermeabile?", a: "Sì, fino a 10 metri senza custodia." },
      { q: "Quanto pesa?", a: "Solo 150g — ultra leggera!" },
    ],
  },
  {
    id: "gaming-controller",
    name: "GamePad Ultra",
    image: "",
    price: "€89,00",
    rating: 4.6,
    description: "Controller premium con feedback aptico per il gaming mobile.",
    videoUrl: "#",
    tags: ["gaming", "communication"],
    faq: [
      { q: "Funziona con il tablet?", a: "Sì, Bluetooth 5.3 universale." },
      { q: "Ha il feedback aptico?", a: "Sì, vibrazione adattiva nei giochi compatibili." },
      { q: "Quanto dura la batteria?", a: "Fino a 40h di gioco continuo." },
    ],
  },
  {
    id: "smart-speaker",
    name: "SoundHub 360",
    image: "",
    price: "€199,00",
    rating: 4.5,
    description: "Suono a 360° con assistente intelligente integrato.",
    videoUrl: "#",
    tags: ["audio", "productivity", "wellness"],
    faq: [
      { q: "Ha l'assistente vocale?", a: "Sì, compatibile con Alexa e Google." },
      { q: "Quante zone audio supporta?", a: "Multiroom fino a 8 speaker." },
      { q: "Quali sono le dimensioni?", a: "Compatto — 18cm di altezza." },
    ],
  },
  {
    id: "tablet-stand",
    name: "DeskHub Pro",
    image: "",
    price: "€129,00",
    rating: 4.4,
    description: "Hub di produttività con dock, caricatore e supporto regolabile.",
    videoUrl: "#",
    tags: ["productivity", "communication"],
    faq: [
      { q: "Carica il dispositivo?", a: "Sì, ricarica rapida 15W integrata." },
      { q: "Ha porte USB?", a: "2x USB-C + 1x USB-A + lettore SD." },
      { q: "Regolazione dell'angolo?", a: "Da 0° a 70° con blocco magnetico." },
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
