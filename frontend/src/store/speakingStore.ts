import { create } from 'zustand';
import { SpeakingMessage } from '../types/speaking';
import api from '../lib/axios';

interface SpeakingState {
  conversationId: string | null;
  messages: SpeakingMessage[];
  status: 'idle' | 'recording' | 'thinking' | 'speaking';
  isLoading: boolean;
  error: string | null;
  durationSeconds: number;
  turnsCompleted: number;
  
  setStatus: (status: 'idle' | 'recording' | 'thinking' | 'speaking') => void;
  addMessage: (msg: SpeakingMessage) => void;
  incrementDuration: (seconds: number) => void;
  resetSession: () => void;
  sendMessage: (message: string) => Promise<string>;
  submitSession: () => Promise<number>;
  clearError: () => void;
}

// Helper to extract corrections from AI reply text e.g., "Hello! [Correction: You said 'He like' instead of 'He likes'.]"
function parseReply(reply: string): { cleanText: string; correction: string | null } {
  const regex = /\[Correction:\s*(.*?)\]/i;
  const match = reply.match(regex);
  if (match) {
    const correction = match[1].trim();
    const cleanText = reply.replace(regex, '').trim();
    return { cleanText, correction };
  }
  return { cleanText: reply, correction: null };
}

export const useSpeakingStore = create<SpeakingState>((set, get) => ({
  conversationId: null,
  messages: [],
  status: 'idle',
  isLoading: false,
  error: null,
  durationSeconds: 0,
  turnsCompleted: 0,

  setStatus: (status) => set({ status }),

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  incrementDuration: (seconds) => set((state) => ({ durationSeconds: state.durationSeconds + seconds })),

  resetSession: () => set({
    conversationId: null,
    messages: [],
    status: 'idle',
    isLoading: false,
    error: null,
    durationSeconds: 0,
    turnsCompleted: 0
  }),

  sendMessage: async (messageText) => {
    set({ isLoading: true, status: 'thinking', error: null });
    
    // Log user message locally
    const userMsg: SpeakingMessage = { role: 'user', content: messageText };
    set((state) => ({ messages: [...state.messages, userMsg] }));

    try {
      const response = await api.post<{ conversation_id: string; reply: string }>('/api/v1/speaking/chat', {
        message: messageText,
        conversation_id: get().conversationId
      });

      const { conversation_id, reply } = response.data;
      const { cleanText, correction } = parseReply(reply);

      // Log AI response locally
      const assistantMsg: SpeakingMessage = { 
        role: 'assistant', 
        content: cleanText,
        correction: correction || undefined
      };

      set((state) => ({
        conversationId: conversation_id,
        messages: [...state.messages, assistantMsg],
        turnsCompleted: state.turnsCompleted + 1,
        status: 'speaking',
        isLoading: false
      }));

      return cleanText;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit speech message.';
      set({ error: msg, status: 'idle', isLoading: false });
      throw new Error(msg);
    }
  },

  submitSession: async () => {
    set({ isLoading: true, error: null });
    const { durationSeconds, turnsCompleted } = get();
    
    try {
      const response = await api.post<{ xp_gained: number }>('/api/v1/speaking/submit', {
        duration_seconds: durationSeconds,
        turns_completed: turnsCompleted
      });
      
      const xp = response.data.xp_gained;
      get().resetSession();
      return xp;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit speaking session.';
      set({ error: msg, isLoading: false });
      return 0;
    }
  },

  clearError: () => set({ error: null })
}));
