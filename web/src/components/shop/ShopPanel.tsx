import React, { useEffect, useState } from 'react';
import { shopApi } from '../../api/shop.api';
import { gardenApi } from '../../api/garden.api';
import { useUserStore } from '../../stores/user.store';
import { useGardenStore } from '../../stores/garden.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';
import type { Seed } from '../../types';

export const ShopPanel: React.FC = () => {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const user = useUserStore((s) => s.user);
  const updateGold = useUserStore((s) => s.updateGold);
  const setSlots = useGardenStore((s) => s.setSlots);

  useEffect(() => {
    shopApi.getSeeds().then(setSeeds);
  }, []);

  const handleBuy = async (seed: Seed) => {
    if (!user || user.gold < seed.priceGold) return;
    setBuying(seed.id);
    try {
      await shopApi.buySeed(seed.id);
      updateGold(-seed.priceGold);
      // Refresh garden
      const garden = await gardenApi.getGarden();
      setSlots(garden);
      bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    } catch (e: any) {
      alert(e.response?.data?.message || '购买失败');
    }
    setBuying(null);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3">🛒 种子商店</h2>
      <div className="space-y-2">
        {seeds.map((seed) => (
          <div
            key={seed.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] border border-[#0f3460] hover:border-[#533483] transition-colors"
          >
            <span className="text-2xl">{seed.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm">{seed.name}</div>
              <div className="text-gray-500 text-xs truncate">{seed.description}</div>
            </div>
            <Button
              onClick={() => handleBuy(seed)}
              disabled={buying === seed.id || (user?.gold ?? 0) < seed.priceGold}
              variant="secondary"
            >
              {buying === seed.id ? '...' : `${seed.priceGold}💰`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
