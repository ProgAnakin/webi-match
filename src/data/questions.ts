export interface Question {
  id: number;
  text: string;
  emoji: string;
  category: string;
}

export const questions: Question[] = [
  { id: 1, text: "Faz esporte regularmente?", emoji: "⚽️", category: "fitness" },
  { id: 2, text: "Ama ouvir música?", emoji: "🎵", category: "audio" },
  { id: 3, text: "Trabalha de casa?", emoji: "🏠", category: "productivity" },
  { id: 4, text: "Gosta de fotografia?", emoji: "📸", category: "camera" },
  { id: 5, text: "Viaja com frequência?", emoji: "✈️", category: "travel" },
  { id: 6, text: "Joga videogames?", emoji: "🎮", category: "gaming" },
  { id: 7, text: "Faz chamadas de vídeo?", emoji: "📹", category: "communication" },
  { id: 8, text: "Pratica meditação ou yoga?", emoji: "🧘", category: "wellness" },
];
