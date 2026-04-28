import client from './client';
import type { Seed, PlayerSeedItem, ShopSort } from '../types';

interface BuySeedResult {
  flower: { id: string; name: string; stage: string; rarity: string; atoms: any[] };
  cost: number;
  remainingGold: number;
}

export const shopApi = {
  getSeeds: (tab: 'system' | 'player' = 'system', sort?: ShopSort) => {
    const params: any = { tab };
    if (tab === 'player' && sort) params.sort = sort;
    return client.get<Seed[] | { system: Seed[]; player: PlayerSeedItem[] }>('/shop/seeds', { params }).then((r) => r.data);
  },

  buySeed: (seedId: string) =>
    client.post<BuySeedResult>('/shop/buy-seed', { seedId }).then((r) => r.data),
};
