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
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);

  useEffect(() => { shopApi.getSeeds().then(setSeeds); }, []);

  const handleBuy = async (seed: Seed) => {
    if (!user || user.gold < seed.priceGold) return;
    setBuying(seed.id);
    try {
      await shopApi.buySeed(seed.id);
      updateGold(-seed.priceGold);
      const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
      setSlots(garden);
      setSeedInventory(inv);
      bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    } catch (e: any) {
      alert(e.response?.data?.message || '购买失败');
    }
    setBuying(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🛒</span>
        <h2 className="text-lg font-bold text-white">种子商店</h2>
      </div>
      <div className="space-y-2">
        {seeds.map((seed) => {
          const canBuy = (user?.gold ?? 0) >= seed.priceGold;
          return (
            <div
              key={seed.id}
              className="card p-3 flex items-center gap-3 animate-fade-in"
            >
              <div className="text-3xl">{seed.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">{seed.name}</div>
                <div className="text-gray-600 text-xs truncate">{seed.description}</div>
              </div>
              <Button
                onClick={() => handleBuy(seed)}
                disabled={buying === seed.id || !canBuy}
                variant={canBuy ? 'primary' : 'secondary'}
                size="sm"
              >
                {buying === seed.id ? '...' : `💰 ${seed.priceGold}`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
