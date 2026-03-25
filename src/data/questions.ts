export interface Question {
  id: number;
  text: string;
  emoji: string;
  category: string;
}

export const questions: Question[] = [
  { id: 1, text: "Fai sport regolarmente?", emoji: "⚽️", category: "fitness" },
  { id: 2, text: "Ami ascoltare musica?", emoji: "🎵", category: "audio" },
  { id: 3, text: "Lavori da casa?", emoji: "🏠", category: "productivity" },
  { id: 4, text: "Ti piace la fotografia?", emoji: "📸", category: "camera" },
  { id: 5, text: "Viaggi spesso?", emoji: "✈️", category: "travel" },
  { id: 6, text: "Giochi ai videogiochi?", emoji: "🎮", category: "gaming" },
  { id: 7, text: "Fai videochiamate?", emoji: "📹", category: "communication" },
  { id: 8, text: "Pratichi meditazione o yoga?", emoji: "🧘", category: "wellness" },
];
