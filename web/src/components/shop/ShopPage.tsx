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
  N: 'text-gray-400 border-gray-600',
  R: 'text-blue-400 border-blue-500/40',
  SR: 'text-purple-400 border-purple-500/40',
  SSR: 'text-amber-400 border-amber-500/40',
  UR: 'text-red-400 border-red-500/40',
};
const RARITY_BG: Record<string, string> = {
  N: 'from-gray-800/60 to-gray-900/40',
  R: 'from-blue-900/20 to-gray-900/30',
  SR: 'from-purple-900/20 to-gray-900/30',
  SSR: 'from-amber-900/20 to-gray-900/30',
  UR: 'from-red-900/20 to-gray-900/30',
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
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a1a]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <span className="text-lg">←</span>
            <span>返回花园</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h1 className="text-lg font-bold text-white">种子商店</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#1a1a2e] rounded-xl p-1 max-w-xs">
          {(['system', 'player'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-btn flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'active bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
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
                  sort === s ? 'bg-purple-800/60 text-white border border-purple-500' : 'bg-[#1a1a2e] text-gray-500 hover:text-gray-300 border border-transparent'
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
                <p className="text-gray-600">暂无系统种子</p>
              </div>
            ) : (
              systemSeeds.map((seed) => {
                const canBuy = (user?.gold ?? 0) >= seed.priceGold;
                return (
                  <div key={seed.id} className="bg-gradient-to-b from-gray-800/60 to-gray-900/30 border border-gray-600 rounded-xl overflow-hidden animate-fade-in hover:shadow-lg hover:scale-[1.02] transition-all">
                    <div className="h-36 bg-[#0a0a1a] flex items-center justify-center">
                      <span className="text-6xl">{seed.emoji}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-bold text-sm mb-1">{seed.name}</h3>
                      <p className="text-gray-600 text-xs mb-3">{seed.description}</p>
                      <button
                        onClick={() => handleBuy(seed.id, seed.priceGold)}
                        disabled={buying === seed.id || !canBuy}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          canBuy
                            ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white hover:from-purple-600 hover:to-purple-500'
                            : 'bg-[#1a1a2e] text-gray-600 cursor-not-allowed'
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
                <p className="text-gray-600">暂无玩家上架的奠基种</p>
              </div>
            ) : (
              sortedPlayer.map((seed) => {
                const canBuy = (user?.gold ?? 0) >= seed.priceGold;
                return (
                  <div key={seed.id} onClick={() => setDetailSeed(seed)} className="bg-gradient-to-b from-purple-900/20 to-gray-900/30 border border-purple-500/30 rounded-xl overflow-hidden animate-fade-in hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
                    {/* Image */}
                    <div className="h-36 bg-[#0a0a1a] flex items-center justify-center overflow-hidden">
                      {seed.imageUrl ? (
                        <img src={seed.imageUrl} alt={seed.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-6xl">{seed.emoji || '⭐'}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-bold text-sm mb-1">{seed.name}</h3>
                      <div className="text-gray-500 text-xs flex gap-2 mb-3">
                        <span>{seed.atomCount} 因子</span>
                        <span>·</span>
                        <span className="text-amber-400/70">已售 {seed.totalSold}</span>
                      </div>
                      <button
                        onClick={() => handleBuy(seed.id, seed.priceGold)}
                        disabled={buying === seed.id || !canBuy}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          canBuy
                            ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white hover:from-purple-600 hover:to-purple-500'
                            : 'bg-[#1a1a2e] text-gray-600 cursor-not-allowed'
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
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-700 to-purple-600 text-white text-sm font-bold hover:from-purple-600 hover:to-purple-500 transition-all disabled:opacity-40"
          >
            {buying === detailSeed.id ? '购买中...' : `🛒 购买 ${detailSeed.priceGold}g`}
          </button>
          <button
            onClick={() => setDetailSeed(null)}
            className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-gray-400 text-sm hover:text-white transition-colors"
          >
            关闭
          </button>
        </FlowerDetailModal>
      )}
    </div>
  );
};
