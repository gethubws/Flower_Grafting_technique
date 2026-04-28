import React from 'react';
import type { AtomBrief } from '../../types';

interface Props {
  title: string;
  name: string | null;
  rarity: string;
  imageUrl: string | null;
  emoji?: string;
  atoms: AtomBrief[];
  factorScore?: number;
  onClose: () => void;
  children?: React.ReactNode; // actions
}

const LEVEL_COLORS: Record<string, string> = {
  N: 'text-[#5a6b4c] bg-gray-800/40 border-gray-600/30',
  R: 'text-blue-700 bg-blue-100/80 border-blue-400/30',
  SR: 'text-purple-700 bg-purple-50/80 border-purple-400/30',
  SSR: 'text-amber-700 bg-amber-50/80 border-amber-400/30',
  UR: 'text-red-700 bg-red-100/80 border-red-500/40',
};

const LEVEL_DOT: Record<string, string> = {
  N: '⚪', R: '🔵', SR: '🟣', SSR: '🟡', UR: '🔴',
};

const RARITY_LABEL: Record<string, string> = {
  N: '普通', R: '稀有', SR: '精良', SSR: '极品', UR: '传说',
};

const RARITY_BG: Record<string, string> = {
  N: 'from-gray-100 to-gray-50',
  R: 'from-blue-50 to-gray-50',
  SR: 'from-purple-50 to-gray-50',
  SSR: 'from-amber-50 to-gray-50',
  UR: 'from-red-50 to-gray-50',
};

export const FlowerDetailModal: React.FC<Props> = ({
  title,
  name,
  rarity,
  imageUrl,
  emoji,
  atoms,
  factorScore,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2e3d23]/30 backdrop-blur-sm" onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-gradient-to-b ${RARITY_BG[rarity] || RARITY_BG.N} border border-[#b5c5a5]/40 rounded-2xl max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto animate-fade-in shadow-2xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#c5d5b5]/30">
        <div>
          <h2 className="text-[#2e3d23] font-bold text-base">{title}</h2>
          <p className="text-[#7a8c6e] text-xs">{name || '未知花'}</p>
        </div>
        <button onClick={onClose} className="text-[#7a8c6e] hover:text-[#2e3d23] text-lg leading-none">✕</button>
      </div>

      {/* Image */}
      <div className="h-64 bg-[#faf7f2] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name || '花'} className="w-full h-full object-contain" />
        ) : (
          <span className="text-8xl opacity-20">{emoji || '🌸'}</span>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex justify-around py-3 border-b border-[#c5d5b5]/30 text-center text-xs">
        <div>
          <div className="text-[#7a8c6e]">稀有度</div>
          <div className={`font-bold ${LEVEL_COLORS[rarity]?.split(' ')[0] || 'text-[#2e3d23]'}`}>
            {RARITY_LABEL[rarity] || rarity}
          </div>
        </div>
        <div>
          <div className="text-[#7a8c6e]">因子数</div>
          <div className="text-[#2e3d23] font-bold">{atoms.length}</div>
        </div>
        <div>
          <div className="text-[#7a8c6e]">积分</div>
          <div className="text-amber-700 font-bold">{factorScore || 0}</div>
        </div>
      </div>

      {/* Atoms list */}
      <div className="p-4">
        <h3 className="text-[#5a6b4c] text-xs font-medium mb-3">🧬 因子详情</h3>
        <div className="flex flex-wrap gap-2">
          {atoms.length === 0 ? (
            <span className="text-[#9aac8a] text-xs">暂无因子数据</span>
          ) : (
            atoms.map((a, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${LEVEL_COLORS[a.level] || LEVEL_COLORS.N}`}
              >
                <span>{LEVEL_DOT[a.level] || '⚪'}</span>
                <span>{a.prompt_chinese || a.id}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      {children && (
        <div className="p-4 border-t border-[#c5d5b5]/30 flex gap-2">
          {children}
        </div>
      )}
    </div>
  </div>
);
