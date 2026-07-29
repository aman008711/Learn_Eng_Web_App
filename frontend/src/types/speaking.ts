export interface SpeakingMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  correction?: string;
  created_at?: string;
}

export interface SpeakingSession {
  conversation_id: string | null;
  messages: SpeakingMessage[];
  status: 'idle' | 'recording' | 'thinking' | 'speaking';
}
