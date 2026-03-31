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
    tags: ["travel", "fitness", "wellness", "camera", "gaming"],
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
    tags: ["wellness", "productivity"],
    faq: [
      { q: "È sicuro per capelli fragili?", a: "Sì! Il controllo termico rileva la temperatura 50 volte al secondo per proteggere i capelli." },
      { q: "Cosa include la confezione?", a: "Asciugacapelli + ugello standard magnetico + ugello diffusore magnetico + manuale." },
      { q: "Quanto è rumoroso?", a: "Solo 59 decibel — molto silenzioso rispetto agli asciugacapelli tradizionali." },
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
