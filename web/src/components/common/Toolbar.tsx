import React from 'react';

interface ToolbarProps {
  activeTool: 'seed' | 'glove' | 'knife' | null;
  setActiveTool: (tool: 'seed' | 'glove' | 'knife' | null) => void;
  seedCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, seedCount }) => {
  const btnClass = (tool: typeof activeTool) =>
    `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      activeTool === tool
        ? 'bg-white/10 border border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]'
        : 'bg-[#1a1a2e]/70 border border-white/5 text-gray-400 hover:border-white/15 hover:text-white'
    }`;

  return (
    <div className="flex items-center justify-center gap-4 p-3 bg-[#0a0a1a]/90 backdrop-blur-md border-t border-white/5">
      {/* Seed Bag */}
      <button
        onClick={() => setActiveTool(activeTool === 'seed' ? null : 'seed')}
        className={btnClass('seed')}
        style={{
          ...(activeTool === 'seed' ? {
            borderColor: 'rgba(245,158,11,0.5)',
            boxShadow: '0 0 16px rgba(245,158,11,0.25)',
            color: '#fbbf24',
          } : {}),
        }}
      >
        <span className="text-lg">🌰</span>
        <span>种子袋</span>
        {seedCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-xxs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {seedCount}
          </span>
        )}
      </button>

      {/* Glove */}
      <button
        onClick={() => setActiveTool(activeTool === 'glove' ? null : 'glove')}
        className={btnClass('glove')}
        style={{
          ...(activeTool === 'glove' ? {
            borderColor: 'rgba(34,197,94,0.5)',
            boxShadow: '0 0 16px rgba(34,197,94,0.25)',
            color: '#4ade80',
          } : {}),
        }}
      >
        <span className="text-lg">🧤</span>
        <span>园艺手套</span>
      </button>

      {/* Grafting Knife */}
      <button
        onClick={() => setActiveTool(activeTool === 'knife' ? null : 'knife')}
        className={btnClass('knife')}
        style={{
          ...(activeTool === 'knife' ? {
            borderColor: 'rgba(168,85,247,0.5)',
            boxShadow: '0 0 16px rgba(168,85,247,0.25)',
            color: '#c084fc',
          } : {}),
        }}
      >
        <span className="text-lg">🔪</span>
        <span>嫁接刀</span>
      </button>

      {/* Hint */}
      <span className="text-gray-700 text-xs ml-2">
        {activeTool === 'seed' ? '选择种子 → 点花盆播种' :
         activeTool === 'glove' ? '点盛放花朵收获' :
         activeTool === 'knife' ? '选择两朵生长期花嫁接' :
         '选择工具开始'}
      </span>
    </div>
  );
};
