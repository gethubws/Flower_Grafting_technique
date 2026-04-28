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
  N: 'text-gray-400 bg-gray-800/40 border-gray-600/30',
  R: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  SR: 'text-purple-400 bg-purple-900/20 border-purple-500/30',
  SSR: 'text-amber-400 bg-amber-900/20 border-amber-500/30',
  UR: 'text-red-400 bg-red-900/20 border-red-500/40',
};

const LEVEL_DOT: Record<string, string> = {
  N: '⚪', R: '🔵', SR: '🟣', SSR: '🟡', UR: '🔴',
};

const RARITY_LABEL: Record<string, string> = {
  N: '普通', R: '稀有', SR: '精良', SSR: '极品', UR: '传说',
};

const RARITY_BG: Record<string, string> = {
  N: 'from-gray-800 to-gray-900',
  R: 'from-blue-900/60 to-gray-900',
  SR: 'from-purple-900/60 to-gray-900',
  SSR: 'from-amber-900/60 to-gray-900',
  UR: 'from-red-900/60 to-gray-900',
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
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-gradient-to-b ${RARITY_BG[rarity] || RARITY_BG.N} border border-white/10 rounded-2xl max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto animate-fade-in shadow-2xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div>
          <h2 className="text-white font-bold text-base">{title}</h2>
          <p className="text-gray-500 text-xs">{name || '未知花'}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
      </div>

      {/* Image */}
      <div className="h-64 bg-[#0a0a1a] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name || '花'} className="w-full h-full object-contain" />
        ) : (
          <span className="text-8xl opacity-20">{emoji || '🌸'}</span>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex justify-around py-3 border-b border-white/5 text-center text-xs">
        <div>
          <div className="text-gray-500">稀有度</div>
          <div className={`font-bold ${LEVEL_COLORS[rarity]?.split(' ')[0] || 'text-white'}`}>
            {RARITY_LABEL[rarity] || rarity}
          </div>
        </div>
        <div>
          <div className="text-gray-500">因子数</div>
          <div className="text-white font-bold">{atoms.length}</div>
        </div>
        <div>
          <div className="text-gray-500">积分</div>
          <div className="text-amber-400 font-bold">{factorScore || 0}</div>
        </div>
      </div>

      {/* Atoms list */}
      <div className="p-4">
        <h3 className="text-gray-400 text-xs font-medium mb-3">🧬 因子详情</h3>
        <div className="flex flex-wrap gap-2">
          {atoms.length === 0 ? (
            <span className="text-gray-600 text-xs">暂无因子数据</span>
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
        <div className="p-4 border-t border-white/5 flex gap-2">
          {children}
        </div>
      )}
    </div>
  </div>
);
