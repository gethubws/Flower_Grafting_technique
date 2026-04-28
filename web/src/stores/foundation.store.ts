import { create } from 'zustand';
import type { FoundationStatus } from '../types';

interface FoundationState {
  mothers: FoundationStatus[];
  setMothers: (mothers: FoundationStatus[]) => void;
}

export const useFoundationStore = create<FoundationState>((set) => ({
  mothers: [],
  setMothers: (mothers) => set({ mothers }),
}));
