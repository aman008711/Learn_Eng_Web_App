export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ChatMetadata {
  conversation_id: string;
  title: string;
}

export interface ContentChunk {
  content?: string;
  error?: string;
}
