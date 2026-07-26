import { create } from 'zustand';
import { DailyWord, SavedWord, QuizQuestion } from '../types/vocab';
import api from '../lib/axios';

interface VocabState {
  dailyWord: DailyWord | null;
  bookmarks: SavedWord[];
  quizQuestions: QuizQuestion[];
  isLoading: boolean;
  error: string | null;
  loadDailyWord: () => Promise<void>;
  loadBookmarks: () => Promise<void>;
  bookmarkWord: (word: DailyWord) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  fetchQuiz: () => Promise<void>;
  submitQuizScore: (score: number, total: number) => Promise<number>;
  clearError: () => void;
}

export const useVocabStore = create<VocabState>((set) => ({
  dailyWord: null,
  bookmarks: [],
  quizQuestions: [],
  isLoading: false,
  error: null,

  loadDailyWord: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<DailyWord>('/api/v1/vocab/daily');
      set({ dailyWord: response.data, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load Daily Word.';
      set({ error: msg, isLoading: false });
    }
  },

  loadBookmarks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<SavedWord[]>('/api/v1/vocab/bookmarks');
      set({ bookmarks: response.data, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load bookmarked vocabulary.';
      set({ error: msg, isLoading: false });
    }
  },

  bookmarkWord: async (word) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<SavedWord>('/api/v1/vocab/save', {
        word: word.word,
        meaning: word.meaning,
        pronunciation: word.pronunciation,
        synonyms: word.synonyms,
        antonyms: word.antonyms,
        examples: word.examples,
      });
      set((state) => ({
        bookmarks: [response.data, ...state.bookmarks],
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to bookmark word.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  removeBookmark: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete('/api/v1/vocab/bookmarks/' + id);
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete bookmark.';
      set({ error: msg, isLoading: false });
    }
  },

  fetchQuiz: async () => {
    set({ isLoading: true, error: null, quizQuestions: [] });
    try {
      const response = await api.get<{ questions: QuizQuestion[] }>('/api/v1/vocab/quiz');
      set({ quizQuestions: response.data.questions, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to fetch vocabulary quiz.';
      set({ error: msg, isLoading: false });
    }
  },

  submitQuizScore: async (score, total) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ xp_gained: number }>('/api/v1/vocab/quiz/submit', {
        score,
        total_questions: total,
      });
      set({ isLoading: false });
      return response.data.xp_gained;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit quiz score.';
      set({ error: msg, isLoading: false });
      return 0;
    }
  },

  clearError: () => set({ error: null }),
}));
