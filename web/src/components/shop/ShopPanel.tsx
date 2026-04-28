import { showToast } from '../common/Toast';
import React, { useEffect, useState } from 'react';
import { useToast } from '../common/Toast';
import { shopApi } from '../../api/shop.api';
import { gardenApi } from '../../api/garden.api';
import { useUserStore } from '../../stores/user.store';
import { useGardenStore } from '../../stores/garden.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';
import type { Seed, PlayerSeedItem, ShopSort } from '../../types';

export const ShopPanel: React.FC = () => {
  const [tab, setTab] = useState<'system' | 'player'>('system');
  const [sort, setSort] = useState<ShopSort>('newest');
  const [systemSeeds, setSystemSeeds] = useState<Seed[]>([]);
  const [playerSeeds, setPlayerSeeds] = useState<PlayerSeedItem[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const user = useUserStore((s) => s.user);
  const toast = useToast();
  const updateGold = useUserStore((s) => s.updateGold);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);

  useEffect(() => {
    if (tab === 'system') {
      shopApi.getSeeds('system').then((data: any) => {
        setSystemSeeds(data?.system || data || []);
      });
    } else {
      shopApi.getSeeds('player', sort).then((data: any) => {
        setPlayerSeeds(data?.player || data || []);
      });
    }
  }, [tab, sort]);

  const refreshGarden = async () => {
    const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
    setSlots(garden);
    setSeedInventory(inv);
    bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
  };

  const doBuy = async (seedId: string, price: number) => {
    if (!user || user.gold < price) return;
    setBuying(seedId);
    try {
      await shopApi.buySeed(seedId);
      updateGold(-price);
      await refreshGarden();
    } catch (e: any) {
      showToast(e.response?.data?.message || '购买失败', 'error')
    }
    setBuying(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🛒</span>
        <h2 className="text-lg font-bold text-[#2e3d23]">种子商店</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-[#ffffff] rounded-lg p-0.5">
        {(['system', 'player'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn flex-1 py-1.5 rounded text-xs font-medium transition-all ${
              tab === t ? 'active bg-white/10 text-[#2e3d23]' : 'text-[#7a8c6e] hover:text-[#3a5a2a]'
            }`}
          >
            {t === 'system' ? '🌱 系统种子' : '⭐ 玩家奠基种'}
          </button>
        ))}
      </div>

      {/* Sort (player only) */}
      {tab === 'player' && (
        <div className="flex gap-1 mb-3">
          {(['newest', 'sales', 'rarity'] as ShopSort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-2 py-0.5 rounded text-xs transition-all ${
                sort === s ? 'bg-purple-200/80 text-[#2e3d23] border border-purple-400' : 'bg-[#ffffff] text-[#7a8c6e] hover:text-[#3a5a2a]'
              }`}
            >
              {{ newest: '最新', sales: '销量', rarity: '稀有度' }[s]}
            </button>
          ))}
        </div>
      )}

      {/* System seeds */}
      {tab === 'system' && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {systemSeeds.length === 0 ? (
            <p className="text-[#9aac8a] text-xs text-center py-4">暂无系统种子</p>
          ) : (
            systemSeeds.map((seed) => {
              const canBuy = (user?.gold ?? 0) >= seed.priceGold;
              return (
                <div key={seed.id} className="card p-3 flex items-center gap-3 animate-fade-in">
                  <div className="text-3xl">{seed.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#2e3d23] font-medium text-sm">{seed.name}</div>
                    <div className="text-[#9aac8a] text-xs truncate">{seed.description}</div>
                  </div>
                  <Button
                    onClick={() => doBuy(seed.id, seed.priceGold)}
                    disabled={buying === seed.id || !canBuy}
                    variant={canBuy ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {buying === seed.id ? '...' : `💰 ${seed.priceGold}`}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Player seeds */}
      {tab === 'player' && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {playerSeeds.length === 0 ? (
            <p className="text-[#9aac8a] text-xs text-center py-4">暂无玩家上架的奠基种</p>
          ) : (
            playerSeeds.map((seed) => {
              const canBuy = (user?.gold ?? 0) >= seed.priceGold;
              return (
                <div key={seed.id} className="card p-3 flex items-center gap-3 animate-fade-in">
                  <div className="text-3xl">{seed.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#2e3d23] font-medium text-sm">{seed.name}</div>
                    <div className="text-[#9aac8a] text-xs">
                      <span className="text-amber-700/70">已售 {seed.totalSold}</span>
                      <span className="mx-1">·</span>
                      <span>{seed.atomCount} 因子</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => doBuy(seed.id, seed.priceGold)}
                    disabled={buying === seed.id || !canBuy}
                    variant={canBuy ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {buying === seed.id ? '...' : `💰 ${seed.priceGold}`}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
