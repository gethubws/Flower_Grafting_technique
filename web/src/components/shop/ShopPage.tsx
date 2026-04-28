import { showToast } from '../common/Toast';
import React, { useEffect, useState } from 'react';
import { shopApi } from '../../api/shop.api';
import { gardenApi } from '../../api/garden.api';
import { useUserStore } from '../../stores/user.store';
import { useGardenStore } from '../../stores/garden.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { FlowerDetailModal } from '../common/FlowerDetailModal';
import { FlowerRose, FlowerSunflower, FlowerTulip, FlowerLily, FlowerOrchid, FlowerFusion, IconCoin } from '../common/GameIcons';
import type { Seed, PlayerSeedItem, ShopSort, AtomBrief } from '../../types';

const FLOWER_SVGS: Record<string, React.FC<any>> = {
  '玫瑰': FlowerRose,
  '向日葵': FlowerSunflower,
  '郁金香': FlowerTulip,
  '百合': FlowerLily,
  '蝴蝶兰': FlowerOrchid,
};

const RARITY_ORDER: Record<string, number> = { UR: 0, SSR: 1, SR: 2, R: 3, N: 4 };

interface Props { onClose: () => void; }

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
      const [sysData, playerData] = await Promise.all([shopApi.getSeeds('system'), shopApi.getSeeds('player', sort)]);
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
      setSlots(garden); setSeedInventory(inv);
      bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    } catch (e: any) { showToast(e.response?.data?.message || '购买失败', 'error') }
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
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #f5f9f3, #FAF8F5)' }} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="sticky top-0 z-10 page-header px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button onClick={onClose} className="flex items-center gap-2 text-[#6D4C41] hover:text-[#3E2723] text-sm transition-all hover:gap-3">
            <span className="text-base">←</span><span className="font-medium">返回花园</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shadow-inner">🛒</div>
            <h1 className="text-lg font-bold" style={{ color: '#3E2723' }}>种子商店</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs — sliding segmented control */}
        <div className="flex mb-6 max-w-xs rounded-2xl p-1.5 border border-white/60 shadow-sm" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)' }}>
          {(['system', 'player'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`tab-btn flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'active bg-white text-green-700 shadow-sm' : 'text-[#8D6E63] hover:text-[#3E2723]'
              }`}
            >{t === 'system' ? '🌱 系统' : '⭐ 玩家'}</button>
          ))}
        </div>

        {/* Sort (player only) */}
        {tab === 'player' && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {(['newest', 'sales', 'rarity'] as ShopSort[]).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  sort === s
                    ? 'bg-green-100 text-green-800 border border-green-300 shadow-sm'
                    : 'bg-white text-[#6D4C41] border border-[rgba(141,110,99,0.15)] hover:border-green-300'
                }`}
              >{{ newest: '🕐 最新', sales: '📈 销量', rarity: '💎 稀有度' }[s]}</button>
            ))}
          </div>
        )}

        {/* ===== System seeds ===== */}
        {tab === 'system' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {systemSeeds.length === 0 ? (
              <div className="col-span-full empty-state">
                <div className="empty-state-icon">🌱</div>
                <div className="empty-state-title">暂无系统种子</div>
                <p className="empty-state-text">商店正在进货中，请稍后再来</p>
              </div>
            ) : (
              systemSeeds.map((seed) => {
                const FlowerSvg = FLOWER_SVGS[seed.name] || FlowerFusion;
                const canBuy = (user?.gold ?? 0) >= seed.priceGold;
                return (
                  <div key={seed.id} className="shop-card animate-fade-in">
                    <div className="img-area">
                      <FlowerSvg size={80} />
                    </div>
                    <div className="info-area">
                      <h3 className="font-extrabold text-base mb-1" style={{ color: '#3E2723' }}>{seed.name}</h3>
                      <p className="text-[#8D6E63] text-xs leading-relaxed mb-4">{seed.description}</p>
                      <button
                        onClick={() => handleBuy(seed.id, seed.priceGold)}
                        disabled={buying === seed.id || !canBuy}
                        className={`w-full py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                          canBuy ? 'btn btn-gold w-full' : 'bg-gray-100 text-gray-400 cursor-not-allowed rounded-xl'
                        }`}
                        style={canBuy ? { width: '100%' } : undefined}
                      >
                        {buying === seed.id ? '购买中...' : <span className="flex items-center justify-center gap-1"><IconCoin size={16} /> {seed.priceGold}g</span>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== Player Foundation seeds ===== */}
        {tab === 'player' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedPlayer.length === 0 ? (
              <div className="col-span-full empty-state">
                <div className="empty-state-icon">⭐</div>
                <div className="empty-state-title">暂无玩家奠基种</div>
                <p className="empty-state-text">完成10次性状稳定培育后可上架自己的奠基种</p>
              </div>
            ) : (
              sortedPlayer.map((seed) => {
                const canBuy = (user?.gold ?? 0) >= seed.priceGold;
                return (
                  <div key={seed.id} onClick={() => setDetailSeed(seed)} className="shop-card glass-card-interactive animate-fade-in">
                    <div className="img-area" style={{ background: 'linear-gradient(135deg, #F3E5F5 0%, #E8F5E9 50%, #FFF8E1 100%)' }}>
                      {seed.imageUrl ? (
                        <img src={seed.imageUrl} alt={seed.name} className="w-full h-full object-contain" />
                      ) : (
                        <FlowerFusion size={80} />
                      )}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200" style={{ zIndex: 2 }}>
                        {seed.atomCount}因子
                      </div>
                    </div>
                    <div className="info-area">
                      <h3 className="font-extrabold text-base mb-1 truncate" style={{ color: '#3E2723' }}>{seed.name}</h3>
                      <div className="text-[#8D6E63] text-xs flex items-center gap-2 mb-4">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                          {seed.atomCount} 因子
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#8D6E63] opacity-20"></span>
                        <span className="text-amber-700 font-medium">已售 {seed.totalSold}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBuy(seed.id, seed.priceGold); }}
                        disabled={buying === seed.id || !canBuy}
                        className={`w-full py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                          canBuy ? 'btn btn-gold w-full' : 'bg-gray-100 text-gray-400 cursor-not-allowed rounded-xl'
                        }`}
                        style={canBuy ? { width: '100%' } : undefined}
                      >
                        {buying === seed.id ? '购买中...' : <span className="flex items-center justify-center gap-1"><IconCoin size={16} /> {seed.priceGold}g</span>}
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
            className="btn btn-gold flex-1 py-2 text-sm"
          >
            🛒 购买 {detailSeed.priceGold}g
          </button>
          <button onClick={() => setDetailSeed(null)} className="btn btn-secondary px-4 py-2 text-sm">关闭</button>
        </FlowerDetailModal>
      )}
    </div>
  );
};
