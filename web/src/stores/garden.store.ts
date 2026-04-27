import { create } from 'zustand';
import type { GardenSlot } from '../types';

interface GardenState {
  slots: GardenSlot[];
  selectedFlowerId: string | null;
  setSlots: (slots: GardenSlot[]) => void;
  updateSlot: (position: number, flower: GardenSlot['flower']) => void;
  removeFlower: (position: number) => void;
  selectFlower: (flowerId: string | null) => void;
}

export const useGardenStore = create<GardenState>((set) => ({
  slots: Array.from({ length: 6 }, (_, i) => ({
    id: null,
    userId: '',
    position: i,
    flowerId: null,
    flower: null,
  })),
  selectedFlowerId: null,

  setSlots: (slots) => set({ slots }),

  updateSlot: (position, flower) =>
    set((s) => ({
      slots: s.slots.map((sl) =>
        sl.position === position ? { ...sl, flowerId: flower?.id || null, flower } : sl,
      ),
    })),

  removeFlower: (position) =>
    set((s) => ({
      slots: s.slots.map((sl) =>
        sl.position === position ? { ...sl, flowerId: null, flower: null } : sl,
      ),
    })),

  selectFlower: (flowerId) => set({ selectedFlowerId: flowerId }),
}));
