export interface Question {
  id: number;
  text: string;
  emoji: string;
  category: string;
}

// Category → product tag mapping (must match TAG_MAP in products.ts):
// sport | audio | productivity | wellness | travel | tech | style | recovery
export const questions: Question[] = [
  { id: 1, text: "Lo sport fa parte della tua routine quotidiana?",                  emoji: "🏋️", category: "sport"        },
  { id: 2, text: "La musica ti accompagna ovunque tu vada?",                         emoji: "🎵", category: "audio"        },
  { id: 3, text: "Ami i gadget che ti semplificano e velocizzano la giornata?",      emoji: "⚡", category: "productivity" },
  { id: 4, text: "Ti concedi ogni giorno un momento di benessere e cura di te?",     emoji: "🌿", category: "wellness"     },
  { id: 5, text: "Ti piace avere con te i tuoi dispositivi anche in viaggio?",       emoji: "✈️", category: "travel"       },
  { id: 6, text: "Sei attratto dai dispositivi smart e dall'ultima tecnologia?",     emoji: "💡", category: "tech"         },
  { id: 7, text: "Per te conta anche il design, oltre alla funzionalità?",           emoji: "✨", category: "style"        },
  { id: 8, text: "Recupero muscolare e sonno di qualità sono importanti per te?",   emoji: "🌙", category: "recovery"     },
];
