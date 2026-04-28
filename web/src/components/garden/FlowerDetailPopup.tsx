import React, { useEffect, useRef, useState } from 'react';
import { FlowerFusion, IconCoin, IconDrop } from '../common/GameIcons';
import type { Flower, AtomBrief } from '../../types';

interface Props {
  flower: Flower | null;
  screenX: number;
  screenY: number;
  onClose: () => void;
  onWater?: (flowerId: string) => void;
  onHarvest?: (flowerId: string) => void;
}

const STAGE_NAMES: Record<string, string> = {
  SEED: '🌰 种子期', SEEDLING: '🌱 幼苗期', GROWING: '🌿 成长期',
  MATURE: '🌼 成熟期', BLOOMING: '🌸 盛放期', RECOVERING: '🩹 恢复期',
};
const STAGE_REMAINING: Record<string, string> = {
  SEED: '约 3 次浇水', SEEDLING: '约 2 次浇水', GROWING: '约 2 次浇水',
  MATURE: '接近盛放', BLOOMING: '✨ 可收获', RECOVERING: '等待恢复...',
};

const getTimeEstimate = (stage: string): string => {
  return STAGE_REMAINING[stage] || '继续成长中';
};

export const FlowerDetailPopup: React.FC<Props> = ({
  flower, screenX, screenY, onClose, onWater, onHarvest,
}) => {
  const [visible, setVisible] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!flower) return;
    // Calculate position: center above the pot
    const popupW = 240;
    const popupH = 280;
    let left = screenX - popupW / 2;
    let top = screenY - popupH - 12;

    // Clamp to viewport
    if (left < 8) left = 8;
    if (left + popupW > window.innerWidth - 8) left = window.innerWidth - popupW - 8;
    if (top < 60) top = 60;
    if (top + popupH > window.innerHeight - 100) top = window.innerHeight - popupH - 100;

    setPos({ left, top });
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
  }, [flower, screenX, screenY]);

  useEffect(() => {
    const handleResize = () => {
      if (!flower) return;
      // Recalculate on resize — parent should re-emit positions
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [flower]);

  if (!flower) return null;

  const factorCount = (flower as any).atoms?.length || (flower as any).atomCount || '?';
  return (
    <div
      ref={popupRef}
      className="fixed z-[200]"
      style={{
        left: pos.left,
        top: pos.top,
        transform: visible ? 'scale(1)' : 'scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out',
        width: 240,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop click to close */}
      <div className="fixed inset-0 z-[-1]" onClick={onClose} />

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: 20,
        boxShadow: '0 20px 60px rgba(93,64,55,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: '1px solid rgba(255,255,255,0.85)',
        position: 'relative',
      }}>
        {/* Arrow pointer */}
        <div style={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '12px solid rgba(255,255,255,0.92)',
          filter: 'drop-shadow(0 4px 4px rgba(93,64,55,0.08))',
        }} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E1, #E8F5E9)' }}>
            <FlowerFusion size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm truncate" style={{ color: '#3E2723' }}>{flower.name || '未知花'}</div>
            <div className="text-xs font-medium text-[#8D6E63] mt-0.5">
              {STAGE_NAMES[flower.stage] || flower.stage}
              {flower.rarity && (
                <span className="ml-1.5 rarity-pill ml-1" style={{
                  background: flower.rarity === 'UR' ? '#FFEBEE' : flower.rarity === 'SSR' ? '#FFF8E1' :
                  flower.rarity === 'SR' ? '#F3E5F5' : flower.rarity === 'R' ? '#E3F2FD' : '#F5F5F5',
                  color: flower.rarity === 'UR' ? '#C62828' : flower.rarity === 'SSR' ? '#E65100' :
                  flower.rarity === 'SR' ? '#7B1FA2' : flower.rarity === 'R' ? '#1565C0' : '#757575',
                  border: `1px solid ${flower.rarity === 'UR' ? '#EF5350' : flower.rarity === 'SSR' ? '#FFB300' : flower.rarity === 'SR' ? '#CE93D8' : flower.rarity === 'R' ? '#90CAF9' : '#E0E0E0'}`,
                }}>
                  {flower.rarity}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stage estimate */}
        <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl" style={{ background: 'rgba(93,185,232,0.08)' }}>
          <span className="text-sm">⏳</span>
          <span className="text-xs font-medium" style={{ color: '#01579B' }}>{getTimeEstimate(flower.stage)}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(76,175,80,0.06)' }}>
            <div className="text-lg font-extrabold" style={{ color: '#2E7D32' }}>{factorCount}</div>
            <div className="text-xxs text-[#8D6E63] font-medium">因子数</div>
          </div>
          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(2,136,209,0.06)' }}>
            <div className="flex items-center justify-center gap-1">
              <IconDrop size={14} />
              <span className="text-lg font-extrabold" style={{ color: '#01579B' }}>
                {Math.max(0, 120 - ((flower as any).growthProgress || 0))}
              </span>
            </div>
            <div className="text-xxs text-[#8D6E63] font-medium">至下一阶段</div>
          </div>
          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,179,0,0.06)' }}>
            <div className="flex items-center justify-center gap-1">
              <IconCoin size={14} />
              <span className="text-lg font-extrabold" style={{ color: '#E65100' }}>
                {(flower as any).sellPrice || (flower as any).estimatedValue || '?'}
              </span>
            </div>
            <div className="text-xxs text-[#8D6E63] font-medium">预估价值</div>
          </div>
          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(156,39,176,0.06)' }}>
            <div className="text-lg" style={{ color: '#7B1FA2' }}>🌱</div>
            <div className="text-xxs text-[#8D6E63] font-medium">肥力充足</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onWater && flower.stage !== 'BLOOMING' && (
            <button
              onClick={() => { onWater(flower.id); onClose(); }}
              className="btn flex-1 py-2.5 text-xs font-extrabold"
              style={{ background: 'linear-gradient(135deg, #81D4FA, #29B6F6)', color: 'white', boxShadow: '0 3px 12px rgba(41,182,246,0.35)', borderRadius: 14 }}
            >
              <IconDrop size={16} /> 浇水
            </button>
          )}
          {onHarvest && (
            <button
              onClick={() => { onHarvest(flower.id); onClose(); }}
              disabled={flower.stage !== 'BLOOMING'}
              className={`btn flex-1 py-2.5 text-xs font-extrabold ${
                flower.stage === 'BLOOMING'
                  ? 'btn btn-gold'
                  : 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400 rounded-xl'
              }`}
              style={flower.stage === 'BLOOMING' ? { width: '100%' } : undefined}
            >
              🧤 收获
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
