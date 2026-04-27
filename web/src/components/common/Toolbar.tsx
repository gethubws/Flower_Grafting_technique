import React from 'react';

interface ToolbarProps {
  activeTool: 'seed' | 'glove' | null;
  setActiveTool: (tool: 'seed' | 'glove' | null) => void;
  seedCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, seedCount }) => {
  return (
    <div className="flex items-center justify-center gap-4 p-2 bg-[#0d1117] border-t border-[#21262d]">
      {/* Seed Bag */}
      <button
        onClick={() => setActiveTool(activeTool === 'seed' ? null : 'seed')}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTool === 'seed'
            ? 'bg-amber-900/40 border border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
            : 'bg-[#1a1a2e] border border-[#1a1a3e] text-gray-400 hover:border-amber-800/50 hover:text-amber-300'
        }`}
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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTool === 'glove'
            ? 'bg-green-900/40 border border-green-500 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
            : 'bg-[#1a1a2e] border border-[#1a1a3e] text-gray-400 hover:border-green-800/50 hover:text-green-300'
        }`}
      >
        <span className="text-lg">🧤</span>
        <span>园艺手套</span>
      </button>

      {/* Hint text */}
      <span className="text-gray-700 text-xs">
        {activeTool === 'seed' ? '点击花盆播种 →' : activeTool === 'glove' ? '点击盛放期花朵收获 →' : '选择工具开始'}
      </span>
    </div>
  );
};
