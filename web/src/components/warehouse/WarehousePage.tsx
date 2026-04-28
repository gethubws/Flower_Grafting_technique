import React, { useEffect, useState } from 'react';
import { warehouseApi } from '../../api/warehouse.api';
import { useUserStore } from '../../stores/user.store';
import { FlowerDetailModal } from '../common/FlowerDetailModal';
import type { WarehouseFlower, AtomBrief } from '../../types';

const RARITY_LABEL: Record<string, string> = { N: '普通', R: '稀有', SR: '精良', SSR: '极品', UR: '传说' };
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

export const WarehousePage: React.FC<Props> = ({ onClose }) => {
  const [flowers, setFlowers] = useState<WarehouseFlower[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selling, setSelling] = useState<string | null>(null);
  const [detailFlower, setDetailFlower] = useState<WarehouseFlower | null>(null);
  const updateGold = useUserStore((s) => s.updateGold);

  useEffect(() => { warehouseApi.list().then(setFlowers); }, []);

  const handleSell = async (f: WarehouseFlower) => {
    if (!f.sellPrice) return;
    setSelling(f.id);
    try {
      const r = await warehouseApi.sell(f.id);
      updateGold(r.goldReceived);
      setFlowers((prev) => prev.filter((x) => x.id !== f.id));
    } catch (e: any) {
      alert(e.response?.data?.message || '出售失败');
    }
    setSelling(null);
  };

  const filtered = filter ? flowers.filter((f) => f.rarity === filter) : flowers;
  const totalValue = filtered.reduce((s, f) => s + (f.sellPrice || 0), 0);

  const rarityOrder = ['', 'UR', 'SSR', 'SR', 'R', 'N'];
  const sorted = [...filtered].sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

  return (
    <div className="fixed inset-0 z-50 bg-[#faf7f2] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="sticky top-0 z-10 page-header px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button onClick={onClose} className="flex items-center gap-2 text-[#5a6b4c] hover:text-[#2e3d23] text-sm transition-all hover:gap-3">
            <span className="text-base">←</span>
            <span className="font-medium">返回花园</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shadow-inner">
              🏚️
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2e3d23] leading-tight">仓库</h1>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#7a8c6e]">{flowers.length} 株花卉</span>
                <span className="w-1 h-1 rounded-full bg-[#a5c9a5]"></span>
                <span className="text-amber-700 font-medium">总价值 💰{totalValue}</span>
              </div>
            </div>
          </div>
          <div />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: '全部', value: flowers.length, icon: '🌸', color: 'bg-green-50 text-green-700' },
            { label: '融合花', value: flowers.filter(f => !f.isShopSeed).length, icon: '⚗️', color: 'bg-purple-50 text-purple-700' },
            { label: '基础花', value: flowers.filter(f => f.isShopSeed).length, icon: '🌱', color: 'bg-blue-50 text-blue-700' },
            { label: '总价值', value: `${totalValue}g`, icon: '💰', color: 'bg-amber-50 text-amber-700' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-4 text-center animate-fade-in`}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs opacity-70 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="leaf-divider mb-5 text-xs">
          <span>🌿 花卉列表</span>
        </div>

        {/* Rarity filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {rarityOrder.map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === r ? 'bg-purple-800/60 text-[#2e3d23] border border-purple-400' : 'bg-[#ffffff] text-[#7a8c6e] hover:text-[#3a5a2a] border border-transparent'
              }`}
            >
              {RARITY_LABEL[r] || '全部'}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {sorted.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏚️</div>
            <div className="text-[#2e3d23] font-bold text-lg mb-2">
              {flowers.length === 0 ? '仓库尚空' : '筛选项无结果'}
            </div>
            <p className="empty-state-text">
              {flowers.length === 0
                ? '种下种子，悉心浇灌，待到盛放时用🧤园艺手套收获，花朵便会存入仓库。'
                : '换个稀有度筛选试试看？'}
            </p>
            {flowers.length === 0 && (
              <div className="flex gap-3 mt-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-lg">🌱</div>
                  <span className="text-xs text-[#7a8c6e]">播种</span>
                </div>
                <div className="flex items-center text-xl text-[#b0c2a0]">→</div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg">💧</div>
                  <span className="text-xs text-[#7a8c6e]">浇水</span>
                </div>
                <div className="flex items-center text-xl text-[#b0c2a0]">→</div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-lg">🌸</div>
                  <span className="text-xs text-[#7a8c6e]">盛放</span>
                </div>
                <div className="flex items-center text-xl text-[#b0c2a0]">→</div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-lg">🧤</div>
                  <span className="text-xs text-[#7a8c6e]">收获</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flower grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((f) => (
            <div
              key={f.id}
              onClick={() => setDetailFlower(f)}
              className={`bg-gradient-to-b ${RARITY_BG[f.rarity] || RARITY_BG.N} border ${RARITY_COLORS[f.rarity] || RARITY_COLORS.N} rounded-xl overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] animate-fade-in cursor-pointer`}
            >
              {/* Image area */}
              <div className="h-52 bg-gradient-to-b from-gray-50 to-[#faf7f2] flex items-center justify-center overflow-hidden relative">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,_#4caf50_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
                {f.imageUrl ? (
                  <img src={f.imageUrl} alt={f.name || '花'} className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-7xl opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">{f.isShopSeed ? '🌱' : '🌸'}</span>
                )}
                {/* Rarity badge overlay */}
                <div className={`absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                  f.rarity === 'UR' ? 'bg-red-100 text-red-700' :
                  f.rarity === 'SSR' ? 'bg-amber-100 text-amber-700' :
                  f.rarity === 'SR' ? 'bg-purple-100 text-purple-700' :
                  f.rarity === 'R' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {f.rarity}级
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-bold text-base text-[#2e3d23] mb-1 truncate group-hover:text-green-700 transition-colors">
                  {f.name || '未知花'}
                </h3>

                <div className="text-[#9aac8a] text-xs flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    {f.atomCount} 因子
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#c5d5b5]"></span>
                  <span>积分 {f.factorScore}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSell(f)}
                    disabled={selling === f.id || !f.sellPrice}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-400 text-[#2e3d23] text-xs font-bold hover:from-amber-500 hover:to-amber-300 transition-all disabled:opacity-40"
                  >
                    {selling === f.id ? '...' : `💰 出售 ${f.sellPrice}g`}
                  </button>
                  {f.name?.includes('×') && (
                    <button
                      onClick={async () => {
                        try {
                          await warehouseApi.designateStability(f.id);
                          alert('✅ 已指定为稳定工程母株');
                        } catch (e: any) {
                          alert(e.response?.data?.message || '指定失败');
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-[#e8f0e0] border border-purple-300/60 text-purple-700 text-xs hover:bg-[#dcedc8] transition-all"
                      title="指定为母株"
                    >
                      🧬
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {detailFlower && (
        <FlowerDetailModal
          title="花详情"
          name={detailFlower.name}
          rarity={detailFlower.rarity}
          imageUrl={detailFlower.imageUrl}
          emoji={detailFlower.isShopSeed ? '🌱' : '🌸'}
          atoms={(detailFlower.atoms || []) as AtomBrief[]}
          factorScore={detailFlower.factorScore}
          onClose={() => setDetailFlower(null)}
        >
          <button
            onClick={() => handleSell(detailFlower)}
            disabled={selling === detailFlower.id || !detailFlower.sellPrice}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-400 text-[#2e3d23] text-sm font-bold hover:from-amber-500 hover:to-amber-300 transition-all disabled:opacity-40"
          >
            {selling === detailFlower.id ? '...' : `💰 出售 ${detailFlower.sellPrice}g`}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#ffffff] text-[#5a6b4c] text-sm hover:text-[#2e3d23] transition-colors"
          >
            关闭
          </button>
        </FlowerDetailModal>
      )}
    </div>
  );
};
