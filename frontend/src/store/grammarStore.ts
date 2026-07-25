import { create } from 'zustand';
import { GrammarCheckRecord } from '../types/grammar';
import api from '../lib/axios';

interface GrammarState {
  history: GrammarCheckRecord[];
  activeRecord: GrammarCheckRecord | null;
  isLoading: boolean;
  error: string | null;
  checkText: (text: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  setActiveRecord: (record: GrammarCheckRecord | null) => void;
  clearError: () => void;
}

export const useGrammarStore = create<GrammarState>((set) => ({
  history: [],
  activeRecord: null,
  isLoading: false,
  error: null,

  checkText: async (text) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<GrammarCheckRecord>('/api/v1/grammar/check', { text });
      const record = response.data;
      set((state) => ({
        history: [record, ...state.history],
        activeRecord: record,
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to analyze text grammar.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  loadHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<GrammarCheckRecord[]>('/api/v1/grammar/history');
      set({ history: response.data, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load grammar history.';
      set({ error: msg, isLoading: false });
    }
  },

  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete('/api/v1/grammar/' + id);
      set((state) => {
        const nextHistory = state.history.filter((item) => item.id !== id);
        const nextActive = state.activeRecord?.id === id ? (nextHistory[0] || null) : state.activeRecord;
        return {
          history: nextHistory,
          activeRecord: nextActive,
          isLoading: false,
        };
      });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete history item.';
      set({ error: msg, isLoading: false });
    }
  },

  setActiveRecord: (record) => set({ activeRecord: record }),
  clearError: () => set({ error: null }),
}));
