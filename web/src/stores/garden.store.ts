import { create } from 'zustand';
import type { GardenSlot, GroupedSeedItem } from '../types';

interface GardenState {
  slots: GardenSlot[];
  seedInventory: GroupedSeedItem[];
  selectedFlowerId: string | null;
  setSlots: (slots: GardenSlot[]) => void;
  updateSlot: (position: number, flower: GardenSlot['flower']) => void;
  removeFlower: (position: number) => void;
  selectFlower: (flowerId: string | null) => void;
  setSeedInventory: (items: GroupedSeedItem[]) => void;
}

export const useGardenStore = create<GardenState>((set) => ({
  slots: Array.from({ length: 6 }, (_, i) => ({
    id: null,
    userId: '',
    position: i,
    flowerId: null,
    flower: null,
  })),
  seedInventory: [],
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

  setSeedInventory: (items) => set({ seedInventory: items }),
}));
