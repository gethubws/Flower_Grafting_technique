import { showToast } from '../common/Toast';
import React, { useEffect, useState } from 'react';
import { warehouseApi } from '../../api/warehouse.api';
import { useUserStore } from '../../stores/user.store';
import { FlowerDetailModal } from '../common/FlowerDetailModal';
import { FlowerFusion, IconCoin } from '../common/GameIcons';
import type { WarehouseFlower, AtomBrief } from '../../types';

const RARITY_LABEL: Record<string, string> = { N: '普通', R: '稀有', SR: '精良', SSR: '极品', UR: '传说' };

interface Props { onClose: () => void; }

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
    } catch (e: any) { showToast(e.response?.data?.message || '出售失败', 'error') }
    setSelling(null);
  };

  const filtered = filter ? flowers.filter((f) => f.rarity === filter) : flowers;
  const totalValue = filtered.reduce((s, f) => s + (f.sellPrice || 0), 0);
  const rarityOrder = ['', 'UR', 'SSR', 'SR', 'R', 'N'];
  const sorted = [...filtered].sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #f5f9f3, #FAF8F5)' }} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="sticky top-0 z-10 page-header px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button onClick={onClose} className="flex items-center gap-2 text-[#6D4C41] hover:text-[#3E2723] text-sm transition-all hover:gap-3 font-medium">
            <span className="text-base">←</span><span>返回花园</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shadow-inner">🏚️</div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#3E2723', lineHeight: 1.2 }}>仓库</h1>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#8D6E63]">{flowers.length} 株花卉</span>
                <span className="w-1 h-1 rounded-full bg-[#A5C9A5]"></span>
                <span className="text-amber-700 font-bold">总价值 💰{totalValue}</span>
              </div>
            </div>
          </div>
          <div />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats bar — glass */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: '全部', value: flowers.length, icon: '🌸', gradient: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)' },
            { label: '融合花', value: flowers.filter(f => !f.isShopSeed).length, icon: '⚗️', gradient: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)' },
            { label: '基础花', value: flowers.filter(f => f.isShopSeed).length, icon: '🌱', gradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)' },
            { label: '总价值', value: `${totalValue}g`, icon: '💰', gradient: 'linear-gradient(135deg, #FFF8E1, #FFECB3)' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card text-center animate-fade-in" style={{ padding: 20 }}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-extrabold" style={{ color: '#3E2723' }}>{stat.value}</div>
              <div className="text-xs text-[#8D6E63] mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="leaf-divider mb-5 text-xs"><span>🌿 花卉列表</span></div>

        {/* Rarity filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {rarityOrder.map((r) => (
            <button key={r} onClick={() => setFilter(r)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                filter === r
                  ? r === 'UR' ? 'bg-red-100 text-red-700 border-red-300' :
                    r === 'SSR' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                    r === 'SR' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                    r === 'R' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                    'bg-green-100 text-green-700 border-green-300'
                  : 'bg-white text-[#8D6E63] border-[rgba(141,110,99,0.12)] hover:border-green-200'
              }`}
            >{RARITY_LABEL[r] || '🌸 全部'}</button>
          ))}
        </div>

        {/* Empty state */}
        {sorted.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏚️</div>
            <div className="empty-state-title">{flowers.length === 0 ? '仓库尚空' : '筛选项无结果'}</div>
            <p className="empty-state-text">
              {flowers.length === 0 ? '种下种子，悉心浇灌，待到盛放时用🧤园艺手套收获，花朵便会存入仓库。' : '换个稀有度筛选试试看？'}
            </p>
            {flowers.length === 0 && (
              <div className="flex gap-3 mt-6">
                {['🌱播种', '💧浇水', '🌸盛放', '🧤收获'].map((step, i) => (
                  <React.Fragment key={step}>
                    {i > 0 && <span className="text-[#8D6E63] text-xl self-center">→</span>}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-lg">{step.slice(0,2)}</div>
                      <span className="text-xs text-[#8D6E63] font-medium">{step.slice(1)}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flower grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((f) => {
            const rarityColor =
              f.rarity === 'UR' ? '#EF5350' : f.rarity === 'SSR' ? '#FFB300' :
              f.rarity === 'SR' ? '#AB47BC' : f.rarity === 'R' ? '#42A5F5' : '#9E9E9E';
            return (
              <div key={f.id} onClick={() => setDetailFlower(f)} className="shop-card glass-card-interactive animate-slide-up">
                <div className="img-area" style={{ height: 180, background: 'linear-gradient(135deg, #F5F5F5 0%, #FAF8F5 50%, #E8F5E9 100%)' }}>
                  {f.imageUrl ? (
                    <img src={f.imageUrl} alt={f.name || '花'} className="w-full h-full object-contain" style={{ transition: 'transform 0.5s' }} />
                  ) : (
                    <FlowerFusion size={80} />
                  )}
                  <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-extrabold border backdrop-blur-sm" style={{
                    background: f.rarity === 'UR' ? 'rgba(255,235,238,0.85)' : f.rarity === 'SSR' ? 'rgba(255,248,225,0.85)' :
                    f.rarity === 'SR' ? 'rgba(243,229,245,0.85)' : f.rarity === 'R' ? 'rgba(227,242,253,0.85)' : 'rgba(250,250,250,0.85)',
                    borderColor: rarityColor, color: rarityColor
                  }}>{f.rarity}级</div>
                </div>
                <div className="info-area">
                  <h3 className="font-extrabold text-base mb-1 truncate" style={{ color: '#3E2723' }}>{f.name || '未知花'}</h3>
                  <div className="text-[#8D6E63] text-xs flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>{f.atomCount} 因子
                    </span>
                    <span>·</span>
                    <span>积分 {f.factorScore}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleSell(f); }}
                      disabled={selling === f.id || !f.sellPrice}
                      className="btn btn-gold flex-1 py-2 text-xs"
                    >
                      {selling === f.id ? '...' : <span className="flex items-center justify-center gap-1"><IconCoin size={14} />{f.sellPrice}g</span>}
                    </button>
                    {f.name?.includes('×') && (
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        try { await warehouseApi.designateStability(f.id); showToast('✅ 已指定为稳定工程母株', 'success') }
                        catch (e: any) { showToast(e.response?.data?.message || '指定失败', 'error') }
                      }}
                      className="btn btn-secondary px-3 py-2 text-xs" title="指定为母株">🧬</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {detailFlower && (
        <FlowerDetailModal
          title="花详情" name={detailFlower.name} rarity={detailFlower.rarity}
          imageUrl={detailFlower.imageUrl} emoji={detailFlower.isShopSeed ? '🌱' : '🌸'}
          atoms={(detailFlower.atoms || []) as AtomBrief[]} factorScore={detailFlower.factorScore}
          onClose={() => setDetailFlower(null)}
        >
          <button onClick={() => handleSell(detailFlower)} disabled={selling === detailFlower.id || !detailFlower.sellPrice}
            className="btn btn-gold flex-1 py-2 text-sm">
            💰 出售 {detailFlower.sellPrice}g
          </button>
          <button onClick={() => setDetailFlower(null)} className="btn btn-secondary px-4 py-2 text-sm">关闭</button>
        </FlowerDetailModal>
      )}
    </div>
  );
};
