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
    description: "O relógio inteligente definitivo para quem vive em movimento.",
    videoUrl: "#",
    tags: ["fitness", "wellness", "travel"],
    faq: [
      { q: "É resistente à água?", a: "Sim! Até 50 metros de profundidade." },
      { q: "Quanto dura a bateria?", a: "Até 7 dias com uso normal." },
      { q: "Funciona com iPhone e Android?", a: "Sim, compatível com ambos." },
    ],
  },
  {
    id: "earbuds-elite",
    name: "EarBuds Elite ANC",
    image: "",
    price: "€179,00",
    rating: 4.9,
    description: "Som premium com cancelamento de ruído adaptativo.",
    videoUrl: "#",
    tags: ["audio", "communication", "travel"],
    faq: [
      { q: "Tem cancelamento de ruído?", a: "Sim, ANC adaptativo de última geração." },
      { q: "Quanto tempo de bateria?", a: "8h de reprodução + 24h com o estojo." },
      { q: "São confortáveis para exercício?", a: "Sim, design ergonômico com pontas intercambiáveis." },
    ],
  },
  {
    id: "camera-360",
    name: "ActionCam 360°",
    image: "",
    price: "€349,00",
    rating: 4.7,
    description: "Capture todos os ângulos das suas aventuras em 4K.",
    videoUrl: "#",
    tags: ["camera", "travel", "fitness"],
    faq: [
      { q: "Grava em 4K?", a: "Sim, até 4K a 60fps com estabilização." },
      { q: "É à prova de água?", a: "Sim, até 10 metros sem carcaça." },
      { q: "Quanto pesa?", a: "Apenas 150g — ultra leve!" },
    ],
  },
  {
    id: "gaming-controller",
    name: "GamePad Ultra",
    image: "",
    price: "€89,00",
    rating: 4.6,
    description: "Controle premium com feedback háptico para gaming mobile.",
    videoUrl: "#",
    tags: ["gaming", "communication"],
    faq: [
      { q: "Funciona com tablet?", a: "Sim, Bluetooth 5.3 universal." },
      { q: "Tem feedback háptico?", a: "Sim, vibração adaptativa em jogos compatíveis." },
      { q: "Quanto dura a bateria?", a: "Até 40h de jogo contínuo." },
    ],
  },
  {
    id: "smart-speaker",
    name: "SoundHub 360",
    image: "",
    price: "€199,00",
    rating: 4.5,
    description: "Som 360° com assistente inteligente integrado.",
    videoUrl: "#",
    tags: ["audio", "productivity", "wellness"],
    faq: [
      { q: "Tem assistente de voz?", a: "Sim, compatível com Alexa e Google." },
      { q: "Quantas zonas de áudio?", a: "Suporta multiroom com até 8 colunas." },
      { q: "Qual o tamanho?", a: "Compacto — 18cm de altura." },
    ],
  },
  {
    id: "tablet-stand",
    name: "DeskHub Pro",
    image: "",
    price: "€129,00",
    rating: 4.4,
    description: "Hub de produtividade com dock, carregador e suporte ajustável.",
    videoUrl: "#",
    tags: ["productivity", "communication"],
    faq: [
      { q: "Carrega o dispositivo?", a: "Sim, carregamento rápido 15W integrado." },
      { q: "Tem portas USB?", a: "2x USB-C + 1x USB-A + leitor SD." },
      { q: "Ajuste de ângulo?", a: "De 0° a 70° com trava magnética." },
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
  const matchPercent = Math.min(98, Math.max(72, Math.round((bestScore / totalTags) * 100 + Math.random() * 10)));

  return { product: bestProduct, matchPercent };
}
