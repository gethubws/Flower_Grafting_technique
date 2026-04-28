import React, { useEffect, useRef, useState } from 'react';
import { FlowerFusion, IconCoin, IconDrop } from '../common/GameIcons';
import type { Flower } from '../../types';

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

const RARITY_GRADIENT: Record<string, [string, string, string]> = {
  N:  ['#F5F5F5', '#E0E0E0', '#9E9E9E'],
  R:  ['#E3F2FD', '#BBDEFB', '#1565C0'],
  SR: ['#F3E5F5', '#E1BEE7', '#7B1FA2'],
  SSR:['#FFF8E1', '#FFE082', '#E65100'],
  UR: ['#FFEBEE', '#EF9A9A', '#C62828'],
};

export const FlowerDetailPopup: React.FC<Props> = ({
  flower, screenX, screenY, onClose, onWater, onHarvest,
}) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!flower) return;
    const popupW = 260;
    const popupH = 320;
    let left = screenX - popupW / 2;
    let top = screenY - popupH - 16;

    if (left < 8) left = 8;
    if (left + popupW > window.innerWidth - 8) left = window.innerWidth - popupW - 8;
    if (top < 60) top = screenY + 24; // flip below
    if (top + popupH > window.innerHeight - 100) top = window.innerHeight - popupH - 100;

    setPos({ left, top });
    setLeaving(false);
    requestAnimationFrame(() => setVisible(true));
  }, [flower, screenX, screenY]);

  // When flower changes to null, animate out then close
  useEffect(() => {
    if (!flower) {
      setLeaving(true);
      const t = setTimeout(() => { setVisible(false); onClose(); }, 250);
      return () => clearTimeout(t);
    }
  }, [flower]);

  if (!flower && !leaving) return null;

  const factorCount = (flower as any)?.atoms?.length || (flower as any)?.atomCount || '?';
  const rarity = flower?.rarity || 'N';
  const [grad1, grad2, gradColor] = RARITY_GRADIENT[rarity] || RARITY_GRADIENT.N;

  return (
    <div
      ref={popupRef}
      className="fixed z-[200]"
      style={{
        left: pos.left,
        top: pos.top,
        transform: leaving ? 'scale(0.92)' : visible ? 'scale(1)' : 'scale(0.9)',
        opacity: leaving ? 0 : visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease-out',
        width: 260,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
      onMouseEnter={() => setLeaving(false)}
      onMouseLeave={() => onClose()}
    >
      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 20,
        padding: 0,
        boxShadow: '0 16px 48px rgba(62,39,35,0.16), 0 0 0 1px rgba(255,255,255,0.7), inset 0 1px 0 rgba(255,255,255,0.9)',
        overflow: 'hidden',
      }}>
        {/* Rarity header stripe */}
        <div style={{
          height: 6,
          background: `linear-gradient(90deg, ${gradColor} 0%, ${grad2} 50%, ${gradColor} 100%)`,
          opacity: 0.6,
        }} />
        
        <div style={{ padding: '16px 18px' }}>
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${grad1}, ${grad2})` }}>
              <FlowerFusion size={28} color={gradColor} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm truncate" style={{ color: '#3E2723' }}>
                {flower?.name || '未知花'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-[#8D6E63]">{STAGE_NAMES[flower?.stage || 'SEED']}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${grad1}, ${grad2})`,
                    color: gradColor,
                    border: `1px solid ${gradColor}40`,
                  }}>
                  {rarity}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 p-2 rounded-xl text-center" style={{ background: `${grad1}40` }}>
              <div className="text-base font-extrabold" style={{ color: gradColor }}>{factorCount}</div>
              <div className="text-[10px] text-[#8D6E63] font-medium">因子</div>
            </div>
            <div className="flex-1 p-2 rounded-xl text-center" style={{ background: `${grad1}40` }}>
              <div className="flex items-center justify-center gap-0.5">
                <IconDrop size={12} color={gradColor} />
                <span className="text-base font-extrabold" style={{ color: gradColor }}>
                  {Math.max(0, 120 - ((flower as any)?.growthProgress || 0))}
                </span>
              </div>
              <div className="text-[10px] text-[#8D6E63] font-medium">进度</div>
            </div>
            <div className="flex-1 p-2 rounded-xl text-center" style={{ background: `${grad1}40` }}>
              <div className="flex items-center justify-center gap-0.5">
                <IconCoin size={12} color={gradColor} />
                <span className="text-base font-extrabold" style={{ color: gradColor }}>
                  {(flower as any)?.sellPrice || (flower as any)?.estimatedValue || '?'}
                </span>
              </div>
              <div className="text-[10px] text-[#8D6E63] font-medium">价值</div>
            </div>
          </div>

          {/* Action buttons — only show when relevant tool is active */}
          {(onWater || onHarvest) && (
            <div className="flex gap-2">
              {onWater && flower?.stage !== 'BLOOMING' && (
                <button
                  onClick={() => { onWater(flower!.id); onClose(); }}
                  className="btn flex-1 py-2 text-xs font-extrabold"
                  style={{
                    background: 'linear-gradient(135deg, #81D4FA, #29B6F6)',
                    color: 'white',
                    boxShadow: '0 2px 10px rgba(41,182,246,0.35)',
                    borderRadius: 12,
                  }}
                >
                  <IconDrop size={14} /> 浇水
                </button>
              )}
              {onHarvest && (
                <button
                  onClick={() => { onHarvest(flower!.id); onClose(); }}
                  disabled={flower?.stage !== 'BLOOMING'}
                  className={`btn flex-1 py-2 text-xs font-extrabold ${flower?.stage === 'BLOOMING' ? 'btn btn-gold' : 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400'}`}
                  style={flower?.stage === 'BLOOMING' ? { width: '100%', borderRadius: 12 } : { borderRadius: 12 }}
                >
                  🧤 收获
                </button>
              )}
            </div>
          )}
          
          {!onWater && !onHarvest && flower?.stage === 'BLOOMING' && (
            <div className="text-center text-xs font-medium" style={{ color: '#E65100' }}>
              ✨ 可收获 — 使用手套工具
            </div>
          )}
          {!onWater && !onHarvest && flower?.stage !== 'BLOOMING' && flower?.stage !== 'SEED' && (
            <div className="text-center text-xs font-medium text-[#8D6E63]">
              {flower?.stage === 'RECOVERING' ? '🩹 恢复中...' : '💧 需要浇水'}
            </div>
          )}
        </div>
      </div>

      {/* Arrow pointer */}
      <div style={{
        position: 'absolute',
        bottom: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '10px solid rgba(255,255,255,0.94)',
        filter: 'drop-shadow(0 2px 3px rgba(62,39,35,0.08))',
      }} />
    </div>
  );
};
