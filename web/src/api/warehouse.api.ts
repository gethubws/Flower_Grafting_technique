import client from './client';
import type { WarehouseFlower } from '../types';

export const warehouseApi = {
  list: (params?: { rarity?: string }) =>
    client.get<WarehouseFlower[]>('/warehouse', { params }).then((r) => r.data),

  sell: (flowerId: string) =>
    client.post<{ flowerId: string; flowerName: string; goldReceived: number }>(
      '/warehouse/sell', { flowerId },
    ).then((r) => r.data),

  designateStability: (flowerId: string) =>
    client.post<{ flowerId: string; designated: boolean }>(
      '/warehouse/designate-stability', { flowerId },
    ).then((r) => r.data),
};
