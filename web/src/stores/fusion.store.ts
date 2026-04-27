import { create } from 'zustand';
import type { FusionResponse, FusionCompletePayload } from '../types';

interface FusionState {
  fusionQueue: string[]; // 拖拽选中的花 ID（最多 2 个）
  resultFlower: FusionCompletePayload | null;
  response: FusionResponse | null;
  isFusing: boolean;

  addToQueue: (flowerId: string) => void;
  removeFromQueue: (flowerId: string) => void;
  clearQueue: () => void;
  setResult: (result: FusionCompletePayload) => void;
  setResponse: (res: FusionResponse | null) => void;
  setFusing: (v: boolean) => void;
}

export const useFusionStore = create<FusionState>((set) => ({
  fusionQueue: [],
  resultFlower: null,
  response: null,
  isFusing: false,

  addToQueue: (id) =>
    set((s) => ({
      fusionQueue: s.fusionQueue.length < 2 ? [...s.fusionQueue, id] : s.fusionQueue,
    })),

  removeFromQueue: (id) =>
    set((s) => ({
      fusionQueue: s.fusionQueue.filter((fid) => fid !== id),
    })),

  clearQueue: () => set({ fusionQueue: [] }),
  setResult: (result) => set({ resultFlower: result }),
  setResponse: (res) => set({ response: res }),
  setFusing: (v) => set({ isFusing: v }),
}));
