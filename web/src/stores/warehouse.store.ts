import { create } from 'zustand';
import type { WarehouseFlower } from '../types';

interface WarehouseState {
  flowers: WarehouseFlower[];
  setFlowers: (flowers: WarehouseFlower[]) => void;
  removeFlower: (flowerId: string) => void;
}

export const useWarehouseStore = create<WarehouseState>((set) => ({
  flowers: [],
  setFlowers: (flowers) => set({ flowers }),
  removeFlower: (flowerId) =>
    set((s) => ({ flowers: s.flowers.filter((f) => f.id !== flowerId) })),
}));
