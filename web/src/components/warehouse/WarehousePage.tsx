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
      <div className="sticky top-0 z-10 bg-[#faf7f2]/95 backdrop-blur-md border-b border-[#c5d5b5]/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={onClose} className="flex items-center gap-1.5 text-[#5a6b4c] hover:text-[#2e3d23] text-sm transition-colors">
            <span className="text-lg">←</span>
            <span>返回花园</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏚️</span>
            <h1 className="text-lg font-bold text-[#2e3d23]">仓库</h1>
            <span className="text-[#9aac8a] text-xs">({flowers.length}株)</span>
            <span className="text-amber-700 text-xs ml-2">总价 💰{totalValue}</span>
          </div>
          <div />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Rarity filter */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏚️</div>
            <p className="text-[#9aac8a]">
              {flowers.length === 0 ? '仓库空空如也，收获花朵后会出现在这里' : '没有该稀有度的花'}
            </p>
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
              <div className="h-48 bg-[#faf7f2] flex items-center justify-center overflow-hidden">
                {f.imageUrl ? (
                  <img src={f.imageUrl} alt={f.name || '花'} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-6xl opacity-30">{f.isShopSeed ? '🌱' : '🌸'}</span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold text-sm ${RARITY_COLORS[f.rarity]?.split(' ')[0] || 'text-[#2e3d23]'}`}>
                    {f.name || '未知花'}
                  </h3>
                  <span className={`text-xs font-bold ${RARITY_COLORS[f.rarity]?.split(' ')[0] || 'text-[#5a6b4c]'}`}>
                    {f.rarity}
                  </span>
                </div>

                <div className="text-[#7a8c6e] text-xs flex gap-2 mb-3">
                  <span>{f.atomCount} 因子</span>
                  <span>·</span>
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
