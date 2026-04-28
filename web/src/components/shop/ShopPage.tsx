import React, { useEffect, useState } from 'react';
import { shopApi } from '../../api/shop.api';
import { gardenApi } from '../../api/garden.api';
import { useUserStore } from '../../stores/user.store';
import { useGardenStore } from '../../stores/garden.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { FlowerDetailModal } from '../common/FlowerDetailModal';
import type { Seed, PlayerSeedItem, ShopSort, AtomBrief } from '../../types';

const RARITY_ORDER: Record<string, number> = { UR: 0, SSR: 1, SR: 2, R: 3, N: 4 };
const RARITY_COLORS: Record<string, string> = {
  N: 'text-[#5a6b4c] border-gray-600',
  R: 'text-blue-600 border-blue-300/60',
  SR: 'text-purple-600 border-purple-300/60',
  SSR: 'text-amber-600 border-amber-300/60',
  UR: 'text-red-700 border-red-400/60',
};
const RARITY_BG: Record<string, string> = {
  N: 'from-gray-100 to-gray-50',
  R: 'from-blue-50 to-gray-50',
  SR: 'from-purple-50 to-gray-50',
  SSR: 'from-amber-50 to-gray-50',
  UR: 'from-red-50 to-gray-50',
};

interface Props {
  onClose: () => void;
}

export const ShopPage: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<'system' | 'player'>('system');
  const [sort, setSort] = useState<ShopSort>('newest');
  const [systemSeeds, setSystemSeeds] = useState<Seed[]>([]);
  const [playerSeeds, setPlayerSeeds] = useState<PlayerSeedItem[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [detailSeed, setDetailSeed] = useState<PlayerSeedItem | null>(null);
  const user = useUserStore((s) => s.user);
  const updateGold = useUserStore((s) => s.updateGold);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);

  useEffect(() => {
    const fetchAll = async () => {
      const [sysData, playerData] = await Promise.all([
        shopApi.getSeeds('system'),
        shopApi.getSeeds('player', sort),
      ]);
      setSystemSeeds((sysData as any)?.system || sysData || []);
      setPlayerSeeds((playerData as any)?.player || playerData || []);
    };
    fetchAll();
  }, [sort]);

  const handleBuy = async (seedId: string, price: number) => {
    if (!user || user.gold < price) return;
    setBuying(seedId);
    try {
      await shopApi.buySeed(seedId);
      updateGold(-price);
      const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
      setSlots(garden);
      setSeedInventory(inv);
      bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    } catch (e: any) {
      alert(e.response?.data?.message || '购买失败');
    }
    setBuying(null);
  };

  const sortedPlayer = [...playerSeeds].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'sales') return b.totalSold - a.totalSold;
    if (sort === 'rarity') {
      const ra = RARITY_ORDER[a.name?.match(/\[(UR|SSR|SR|R|N)\]/)?.[1] || 'N'] ?? 99;
      const rb = RARITY_ORDER[b.name?.match(/\[(UR|SSR|SR|R|N)\]/)?.[1] || 'N'] ?? 99;
      return ra - rb;
    }
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#faf7f2] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#faf7f2]/95 backdrop-blur-md border-b border-[#c5d5b5]/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={onClose} className="flex items-center gap-1.5 text-[#5a6b4c] hover:text-[#2e3d23] text-sm transition-colors">
            <span className="text-lg">←</span>
            <span>返回花园</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h1 className="text-lg font-bold text-[#2e3d23]">种子商店</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#ffffff] rounded-xl p-1 max-w-xs">
          {(['system', 'player'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-btn flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'active bg-white/10 text-[#2e3d23]' : 'text-[#7a8c6e] hover:text-[#3a5a2a]'
              }`}
            >
              {t === 'system' ? '🌱 系统' : '⭐ 玩家'}
            </button>
          ))}
        </div>

        {/* Sort (player) */}
        {tab === 'player' && (
          <div className="flex gap-1.5 mb-4">
            {(['newest', 'sales', 'rarity'] as ShopSort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  sort === s ? 'bg-purple-800/60 text-[#2e3d23] border border-purple-400' : 'bg-[#ffffff] text-[#7a8c6e] hover:text-[#3a5a2a] border border-transparent'
                }`}
              >
                {{ newest: '🕐 最新', sales: '📈 销量', rarity: '💎 稀有度' }[s]}
              </button>
            ))}
          </div>
        )}

        {/* System seeds */}
        {tab === 'system' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemSeeds.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-[#9aac8a]">暂无系统种子</p>
              </div>
            ) : (
              systemSeeds.map((seed) => {
                const canBuy = (user?.gold ?? 0) >= seed.priceGold;
                return (
                  <div key={seed.id} className="bg-gradient-to-b from-gray-800/60 to-gray-900/30 border border-gray-600 rounded-xl overflow-hidden animate-fade-in hover:shadow-lg hover:scale-[1.02] transition-all">
                    <div className="h-36 bg-[#faf7f2] flex items-center justify-center">
                      <span className="text-6xl">{seed.emoji}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#2e3d23] font-bold text-sm mb-1">{seed.name}</h3>
                      <p className="text-[#9aac8a] text-xs mb-3">{seed.description}</p>
                      <button
                        onClick={() => handleBuy(seed.id, seed.priceGold)}
                        disabled={buying === seed.id || !canBuy}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          canBuy
                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-[#2e3d23] hover:from-purple-600 hover:to-purple-500'
                            : 'bg-[#ffffff] text-[#9aac8a] cursor-not-allowed'
                        } disabled:opacity-40`}
                      >
                        {buying === seed.id ? '购买中...' : `💰 ${seed.priceGold}g`}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Player seeds */}
        {tab === 'player' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayer.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-6xl mb-4">⭐</div>
                <p className="text-[#9aac8a]">暂无玩家上架的奠基种</p>
              </div>
            ) : (
              sortedPlayer.map((seed) => {
                const canBuy = (user?.gold ?? 0) >= seed.priceGold;
                return (
                  <div key={seed.id} onClick={() => setDetailSeed(seed)} className="bg-gradient-to-b from-purple-900/20 to-gray-900/30 border border-purple-400/30 rounded-xl overflow-hidden animate-fade-in hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
                    {/* Image */}
                    <div className="h-36 bg-[#faf7f2] flex items-center justify-center overflow-hidden">
                      {seed.imageUrl ? (
                        <img src={seed.imageUrl} alt={seed.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-6xl">{seed.emoji || '⭐'}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#2e3d23] font-bold text-sm mb-1">{seed.name}</h3>
                      <div className="text-[#7a8c6e] text-xs flex gap-2 mb-3">
                        <span>{seed.atomCount} 因子</span>
                        <span>·</span>
                        <span className="text-amber-700/70">已售 {seed.totalSold}</span>
                      </div>
                      <button
                        onClick={() => handleBuy(seed.id, seed.priceGold)}
                        disabled={buying === seed.id || !canBuy}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          canBuy
                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-[#2e3d23] hover:from-purple-600 hover:to-purple-500'
                            : 'bg-[#ffffff] text-[#9aac8a] cursor-not-allowed'
                        } disabled:opacity-40`}
                      >
                        {buying === seed.id ? '购买中...' : `💰 ${seed.priceGold}g`}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailSeed && (
        <FlowerDetailModal
          title="奠基种详情"
          name={detailSeed.name}
          rarity="N"
          imageUrl={detailSeed.imageUrl}
          emoji={detailSeed.emoji}
          atoms={(detailSeed.atoms || []) as AtomBrief[]}
          onClose={() => setDetailSeed(null)}
        >
          <button
            onClick={() => { handleBuy(detailSeed.id, detailSeed.priceGold); setDetailSeed(null); }}
            disabled={buying === detailSeed.id || !user || user.gold < detailSeed.priceGold}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-[#2e3d23] text-sm font-bold hover:from-purple-600 hover:to-purple-500 transition-all disabled:opacity-40"
          >
            {buying === detailSeed.id ? '购买中...' : `🛒 购买 ${detailSeed.priceGold}g`}
          </button>
          <button
            onClick={() => setDetailSeed(null)}
            className="px-4 py-2 rounded-lg bg-[#ffffff] text-[#5a6b4c] text-sm hover:text-[#2e3d23] transition-colors"
          >
            关闭
          </button>
        </FlowerDetailModal>
      )}
    </div>
  );
};
