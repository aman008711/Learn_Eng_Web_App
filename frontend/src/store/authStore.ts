import { create } from 'zustand';
import { User } from '../types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,
  
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true, error: null });
  },
  
  setAccessToken: (accessToken) => {
    localStorage.setItem('access_token', accessToken);
    set({ accessToken, isAuthenticated: true });
  },
  
  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
  
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
