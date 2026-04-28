import React, { useEffect, useState } from 'react';
import { foundationApi } from '../../api/foundation.api';
import { useFoundationStore } from '../../stores/foundation.store';
import { useUserStore } from '../../stores/user.store';
import { Button } from '../common/Button';
import type { FoundationStatus } from '../../types';

const RARITY_COLORS: Record<string, string> = {
  N: 'text-[#5a6b4c]', R: 'text-blue-600', SR: 'text-purple-600', SSR: 'text-amber-600', UR: 'text-red-700',
};

export const FoundationPanel: React.FC = () => {
  const mothers = useFoundationStore((s) => s.mothers);
  const setMothers = useFoundationStore((s) => s.setMothers);
  const user = useUserStore((s) => s.user);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [listing, setListing] = useState<string | null>(null);
  const [price, setPrice] = useState(500);

  useEffect(() => { foundationApi.getStatus().then(setMothers); }, []);

  const handleClaim = async (flowerId: string) => {
    setClaiming(flowerId);
    try {
      const result = await foundationApi.claimSeed(flowerId);
      alert(`🌱 已领取奠基种！\n「${result.name}」(${result.rarity}级, ${result.atomCount}因子)\n种子已加入背包`);
    } catch (e: any) {
      alert(e.response?.data?.message || '领取失败');
    }
    setClaiming(null);
  };

  const handleListShop = async (flowerId: string) => {
    setListing(flowerId);
    try {
      const result = await foundationApi.listShop(flowerId, price);
      alert(`🛒 已上架！\n「${result.name}」售价 ${result.price}g`);
      foundationApi.getStatus().then(setMothers);
    } catch (e: any) {
      alert(e.response?.data?.message || '上架失败');
    }
    setListing(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧬</span>
        <h2 className="text-lg font-bold text-[#2e3d23]">性状稳定工程</h2>
        {user?.title && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100/80 text-purple-600 border border-purple-700/30">
            🏅 {user.title}
          </span>
        )}
      </div>

      {mothers.length === 0 ? (
        <p className="text-[#9aac8a] text-xs text-center py-6">
          还没有母株。将融合花收获后，在仓库中点击「🧬育种」指定为母株。
        </p>
      ) : (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
          {mothers.map((m) => (
            <div
              key={m.id}
              className={`card p-3 animate-fade-in ${
                m.isFoundation ? 'rarity-SSR' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`font-medium text-sm ${RARITY_COLORS[m.rarity]}`}>
                  {m.name || '未命名母株'}
                </div>
                {m.isFoundation && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-700">
                    ⭐ 奠基种
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="progress-bar mb-2">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${(m.stabilityProgress / 10) * 100}%`,
                    background: m.isFoundation
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : 'linear-gradient(90deg, #66bb6a, #7b2ff7)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="text-[#7a8c6e]">
                  进度 {m.stabilityProgress}/10
                  {!m.isFoundation && <span className="ml-1 text-[#b0c2a0]">(还需 {m.remaining} 次相似)</span>}
                </div>
                <div className="text-[#9aac8a]">
                  {m.atomCount}因子 · 积分{m.factorScore}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 mt-2">
                {m.isFoundation ? (
                  <>
                    <Button
                      onClick={() => handleClaim(m.id)}
                      disabled={claiming === m.id}
                      variant="success"
                      size="xs"
                    >
                      {claiming === m.id ? '...' : '🌱 领取种子'}
                    </Button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 rounded bg-[#ffffff] border border-[#c5e1a5] text-[#2e3d23] text-xs"
                        min={1}
                      />
                      <Button
                        onClick={() => handleListShop(m.id)}
                        disabled={listing === m.id}
                        variant="primary"
                        size="xs"
                      >
                        🛒 上架
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-[#b0c2a0] text-xs">继续融合以推进稳定化</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
