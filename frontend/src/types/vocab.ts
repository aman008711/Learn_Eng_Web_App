export interface DailyWord {
  word: string;
  meaning: string;
  pronunciation?: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
}

export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}
