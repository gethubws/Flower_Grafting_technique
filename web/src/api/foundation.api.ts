import client from './client';
import type { FoundationStatus } from '../types';

export const foundationApi = {
  getStatus: () =>
    client.get<FoundationStatus[]>('/foundation/status').then((r) => r.data),

  claimSeed: (flowerId: string) =>
    client.post<{ seedId: string; name: string; rarity: string; atomCount: number }>(
      '/foundation/claim-seed', { flowerId },
    ).then((r) => r.data),

  listShop: (flowerId: string, price: number) =>
    client.post<{ seedId: string; name: string; price: number }>(
      '/foundation/list-shop', { flowerId, price },
    ).then((r) => r.data),

  unlistShop: (seedId: string) =>
    client.post<{ seedId: string; unlisted: boolean }>(
      '/foundation/unlist-shop', { seedId },
    ).then((r) => r.data),

  getRevenue: () =>
    client.get<{ listings: any[]; totalRevenue: number }>('/foundation/revenue').then((r) => r.data),
};
