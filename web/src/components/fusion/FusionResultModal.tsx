import React, { useEffect, useState } from 'react';
import { useFusionStore } from '../../stores/fusion.store';

export const FusionResultModal: React.FC = () => {
  const result = useFusionStore((s) => s.resultFlower);
  const setResult = useFusionStore((s) => s.setResult);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result) setVisible(true);
  }, [result]);

  if (!visible || !result) return null;

  const rarityColors: Record<string, string> = {
    N: 'text-gray-400', R: 'text-blue-400', SR: 'text-purple-400',
    SSR: 'text-amber-400', UR: 'text-red-400',
  };
  const rarityBg: Record<string, string> = {
    N: 'from-gray-900 to-gray-800 border-gray-600',
    R: 'from-blue-900/50 to-blue-800/30 border-blue-500',
    SR: 'from-purple-900/50 to-purple-800/30 border-purple-500',
    SSR: 'from-amber-900/50 to-amber-800/30 border-amber-500',
    UR: 'from-red-900/50 to-red-800/30 border-red-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setVisible(false); setResult(null); }}>
      <div
        className={`bg-gradient-to-b ${rarityBg[result.rarity] || rarityBg.N} border rounded-2xl p-6 w-80 text-center animate-fade-in shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sparkle */}
        <div className="text-5xl mb-2 animate-bounce-soft">
          {result.rarity === 'UR' ? '🌟' : result.rarity === 'SSR' ? '✨' : '🌺'}
        </div>
        <h2 className={`text-2xl font-bold mb-1 ${rarityColors[result.rarity] || 'text-white'}`}>
          {result.rarity} 级新花！
        </h2>
        <p className="text-gray-400 text-sm mb-4">融合成功</p>

        {/* Reward */}
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-2xl">💰</div>
            <div className="text-amber-400 font-bold text-lg">+{result.reward.gold}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">⭐</div>
            <div className="text-purple-400 font-bold text-lg">+{result.reward.xp}</div>
          </div>
        </div>

        {result.isFirstTime && (
          <div className="bg-amber-900/30 border border-amber-600/30 rounded-lg px-3 py-1.5 mb-3 text-amber-400 text-xs">
            🎉 首达奖励！双倍收获
          </div>
        )}

        <p className="text-gray-600 text-xs mb-3">新花已种入花园，浇水到盛放即可收获</p>

        <button
          onClick={() => { setVisible(false); setResult(null); }}
          className="w-full py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
        >
          知道了
        </button>
      </div>
    </div>
  );
};
