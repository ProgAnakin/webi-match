export interface Question {
  id: number;
  text: string;
  emoji: string;
  category: string;
}

// Category → product tag mapping (must match TAG_MAP in products.ts):
// sport | audio | productivity | wellness | travel | tech | style | recovery
export const questions: Question[] = [
  { id: 1, text: "Ti alleni regolarmente o pratichi sport?",                         emoji: "🏋️", category: "sport"        },
  { id: 2, text: "La musica è sempre con te, anche durante l'allenamento?",          emoji: "🎵", category: "audio"        },
  { id: 3, text: "Cerchi sempre modi per ottimizzare il tuo tempo?",                 emoji: "⚡", category: "productivity" },
  { id: 4, text: "Dedichi ogni giorno del tempo alla cura di te stesso?",            emoji: "🌿", category: "wellness"     },
  { id: 5, text: "Sei spesso in movimento o viaggi fuori casa?",                     emoji: "✈️", category: "travel"       },
  { id: 6, text: "Ami i gadget smart che tracciano salute e attività?",              emoji: "💡", category: "tech"         },
  { id: 7, text: "Il design e l'estetica degli oggetti contano tanto per te?",       emoji: "✨", category: "style"        },
  { id: 8, text: "Il recupero fisico e il sonno di qualità sono una priorità?",     emoji: "🌙", category: "recovery"     },
];
