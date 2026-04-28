import React, { useEffect, useState } from 'react';
import { warehouseApi } from '../../api/warehouse.api';
import { useWarehouseStore } from '../../stores/warehouse.store';
import { useUserStore } from '../../stores/user.store';
import { Button } from '../common/Button';
import type { WarehouseFlower } from '../../types';

const RARITY_COLORS: Record<string, string> = {
  N: 'text-gray-400', R: 'text-blue-400', SR: 'text-purple-400', SSR: 'text-amber-400', UR: 'text-red-400',
};

export const WarehousePanel: React.FC = () => {
  const flowers = useWarehouseStore((s) => s.flowers);
  const setFlowers = useWarehouseStore((s) => s.setFlowers);
  const removeFlower = useWarehouseStore((s) => s.removeFlower);
  const updateGold = useUserStore((s) => s.updateGold);
  const [selling, setSelling] = useState<string | null>(null);
  const [designating, setDesignating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => { warehouseApi.list().then(setFlowers); }, []);

  const handleSell = async (flower: WarehouseFlower) => {
    if (!flower.sellPrice) return;
    setSelling(flower.id);
    try {
      const result = await warehouseApi.sell(flower.id);
      updateGold(result.goldReceived);
      removeFlower(flower.id);
    } catch (e: any) {
      alert(e.response?.data?.message || '出售失败');
    }
    setSelling(null);
  };

  const handleDesignate = async (flowerId: string) => {
    setDesignating(flowerId);
    try {
      await warehouseApi.designateStability(flowerId);
      alert('✅ 已指定为性状稳定工程母株\n下次融合时传入 stabilityTargetId 即可追踪进度');
    } catch (e: any) {
      alert(e.response?.data?.message || '指定失败');
    }
    setDesignating(null);
  };

  const filtered = filter ? flowers.filter((f) => f.rarity === filter) : flowers;
  const totalValue = filtered.reduce((s, f) => s + (f.sellPrice || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏚️</span>
          <h2 className="text-lg font-bold text-white">仓库</h2>
          <span className="text-gray-600 text-xs">({flowers.length}株)</span>
        </div>
        <span className="text-amber-400 text-xs">总值 💰{totalValue}</span>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {['', 'N', 'R', 'SR', 'SSR', 'UR'].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-2 py-0.5 rounded text-xs transition-all ${
              filter === r ? 'bg-purple-900/50 text-white border border-purple-500' : 'bg-[#1a1a2e] text-gray-500 hover:text-gray-300'
            }`}
          >
            {r || '全部'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-6">
          {flowers.length === 0 ? '仓库空空如也，收获花朵后会出现在这里' : '没有该稀有度的花'}
        </p>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {filtered.map((f) => (
            <div
              key={f.id}
              className="card p-3 flex items-center gap-3 animate-fade-in"
            >
              <div className="text-2xl">{f.isShopSeed ? '🌱' : '🌸'}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${RARITY_COLORS[f.rarity] || 'text-white'}`}>
                  {f.name || '未知花'}
                </div>
                <div className="text-gray-600 text-xs flex gap-2">
                  <span>{f.rarity}级</span>
                  <span>·</span>
                  <span>{f.atomCount}因子</span>
                  <span>·</span>
                  <span>积分{f.factorScore}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  onClick={() => handleDesignate(f.id)}
                  disabled={designating === f.id || !f.name?.includes('×')}
                  variant="secondary"
                  size="xs"
                >
                  🧬 育种
                </Button>
                <Button
                  onClick={() => handleSell(f)}
                  disabled={selling === f.id || !f.sellPrice}
                  variant="primary"
                  size="xs"
                >
                  {selling === f.id ? '...' : `💰 ${f.sellPrice}`}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
