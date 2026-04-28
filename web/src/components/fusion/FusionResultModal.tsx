import React, { useEffect, useState } from 'react';
import { useFusionStore } from '../../stores/fusion.store';

export const FusionResultModal: React.FC = () => {
  const result = useFusionStore((s) => s.resultFlower);
  const response = useFusionStore((s) => s.response);
  const setResult = useFusionStore((s) => s.setResult);
  const setResponse = useFusionStore((s) => s.setResponse);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (result) setVisible(true);
  }, [result]);

  if (!visible || !result) return null;

  const rarityColors: Record<string, string> = {
    N: 'text-[#5a6b4c]', R: 'text-blue-600', SR: 'text-purple-600',
    SSR: 'text-amber-600', UR: 'text-red-700',
  };
  const rarityBg: Record<string, string> = {
    N: 'from-gray-900 to-gray-800 border-gray-600',
    R: 'from-blue-100 to-blue-50 border-blue-400',
    SR: 'from-purple-100 to-purple-50 border-purple-400',
    SSR: 'from-amber-100 to-amber-50 border-amber-400',
    UR: 'from-red-100 to-red-50 border-red-500',
  };

  const close = () => { setVisible(false); setResult(null); setResponse(null); setShowDetails(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2e3d23]/25 backdrop-blur-sm" onClick={close}>
      <div
        className={`bg-gradient-to-b ${rarityBg[result.rarity] || rarityBg.N} border rounded-2xl p-6 w-80 max-h-[85vh] overflow-y-auto text-center animate-fade-in shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sparkle */}
        <div className="text-5xl mb-2 animate-bounce-soft">
          {result.rarity === 'UR' ? '🌟' : result.rarity === 'SSR' ? '✨' : '🌺'}
        </div>
        <h2 className={`text-2xl font-bold mb-1 ${rarityColors[result.rarity] || 'text-[#2e3d23]'}`}>
          {result.rarity} 级新花！
        </h2>
        <p className="text-[#5a6b4c] text-sm mb-4">融合成功</p>

        {/* Gene stats (Phase 1.5) */}
        {response && (
          <div className="bg-[#2e3d23]/5 rounded-lg p-3 mb-3 text-xs text-left">
            <div className="flex justify-between text-[#5a6b4c] mb-1">
              <span>🧬 基因继承</span>
              <span className="text-[#2e3d23] font-medium">{response.inheritedCount || 0} / {(response.inheritedCount || 0) + (response.droppedCount || 0)}</span>
            </div>
            {response.droppedCount ? (
              <p className="text-red-700/70 mb-1">丢失 {response.droppedCount} 个因子</p>
            ) : null}
            {response.doubleCount ? (
              <p className="text-amber-700/70 mb-1">🔁 多倍体 ×{response.doubleCount + 1}</p>
            ) : null}
            {(response.appliedRules || []).length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-[#c5d5b5]/30">
                <span className="text-purple-700">✨ 融合触发：</span>
                {response.appliedRules!.map((r, i) => (
                  <span key={i} className="text-purple-600 ml-1">{r}</span>
                ))}
              </div>
            )}
            <div className="mt-1.5 pt-1.5 border-t border-[#c5d5b5]/30 flex justify-between">
              <span className="text-[#7a8c6e]">因子积分</span>
              <span className="text-amber-700 font-bold">{response.factorScore || 0}</span>
            </div>
          </div>
        )}

        {/* Stability result */}
        {response?.stabilityResult && (
          <div className={`rounded-lg p-2 mb-3 text-xs ${response.stabilityResult.similar ? 'bg-green-100/60 border border-green-700/30' : 'bg-red-100/80 border border-red-700/30'}`}>
            {response.stabilityResult.similar ? (
              <div>
                <span className="text-green-700">✅ 性状相似 (差异{response.stabilityResult.diff})</span>
                <div className="text-green-700 mt-0.5">
                  进度 {response.stabilityResult.progress}/10
                  {response.stabilityResult.becameFoundation && ' 🏆 奠基种认证！'}
                </div>
              </div>
            ) : (
              <span className="text-red-700">
                ❌ {response.stabilityResult.reason === 'rarity_mismatch' ? '稀有度不一致' : `基因差异过大 (${response.stabilityResult.diff})`}
              </span>
            )}
          </div>
        )}

        {/* Reward */}
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-2xl">💰</div>
            <div className="text-amber-700 font-bold text-lg">+{result.reward.gold}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">⭐</div>
            <div className="text-purple-700 font-bold text-lg">+{result.reward.xp}</div>
          </div>
        </div>

        {result.isFirstTime && (
          <div className="bg-amber-100/60 border border-amber-400/40 rounded-lg px-3 py-1.5 mb-3 text-amber-700 text-xs">
            🎉 首达奖励！双倍收获
          </div>
        )}

        {/* Atoms preview (toggle) */}
        {result.atoms.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[#7a8c6e] text-xs hover:text-[#3a5a2a]"
            >
              {showDetails ? '收起' : '查看'} {result.atoms.length} 个因子
            </button>
            {showDetails && (
              <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
                {result.atoms.map((a: any, i: number) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-[#5a6b4c] text-xs">
                    {typeof a === 'string' ? a : (a.id || a.prompt_chinese || '?')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-[#9aac8a] text-xs mb-3">新花已种入花园，浇水到盛放即可收获</p>

        <button
          onClick={close}
          className="w-full py-2 rounded-lg bg-white/10 text-[#2e3d23] text-sm hover:bg-white/20 transition-colors"
        >
          知道了
        </button>
      </div>
    </div>
  );
};
