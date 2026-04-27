import client from './client';
import type { Seed } from '../types';

interface BuySeedResult {
  flower: { id: string; stage: string };
  cost: number;
  remainingGold: number;
}

export const shopApi = {
  getSeeds: () => client.get<Seed[]>('/shop/seeds').then((r) => r.data),

  buySeed: (seedId: string) =>
    client.post<BuySeedResult>('/shop/buy-seed', { seedId }).then((r) => r.data),
};
