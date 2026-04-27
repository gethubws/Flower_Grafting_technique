import { create } from 'zustand';
import type { User } from '../types';

interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  updateGold: (delta: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),

  setUser: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  updateGold: (delta) =>
    set((s) => ({
      user: s.user ? { ...s.user, gold: s.user.gold + delta } : null,
    })),
}));
