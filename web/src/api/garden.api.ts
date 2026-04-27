import client from './client';
import type { GardenSlot, Flower, GroupedSeedItem } from '../types';

export const gardenApi = {
  getGarden: () => client.get<GardenSlot[]>('/garden').then((r) => r.data),

  getSeedInventory: () => client.get<GroupedSeedItem[]>('/garden/inventory').then((r) => r.data),

  plant: (flowerId: string, position: number) =>
    client.post<{ slot: number; flower: Flower }>('/garden/plant', { flowerId, position }).then((r) => r.data),

  grow: (flowerId: string) =>
    client.post<{ flower: Flower }>('/garden/grow', { flowerId }).then((r) => r.data),

  harvest: (flowerId: string) =>
    client.post<{ flowerId: string; flowerName: string; rarity: string; reward: { gold: number; xp: number } }>(
      '/garden/harvest',
      { flowerId },
    ).then((r) => r.data),
};
