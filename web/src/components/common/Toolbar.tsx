import React from 'react';
import {
  IconSeedBag, IconGlove, IconKnife, IconWarehouse, IconDNA,
} from './GameIcons';

interface ToolbarProps {
  activeTool: 'seed' | 'glove' | 'knife' | null;
  setActiveTool: (tool: 'seed' | 'glove' | 'knife' | null) => void;
  seedCount: number;
  onOpenWarehouse?: () => void;
  onOpenFoundation?: () => void;
  onOpenShop?: () => void;
  currentPage?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  seedCount,
  onOpenWarehouse,
  onOpenFoundation,
  onOpenShop,
  currentPage,
}) => {
  const isPageActive = (page: string) => currentPage === page;

  return (
    <div className="tool-dock">
      {/* 种子袋 */}
      <button
        onClick={() => setActiveTool(activeTool === 'seed' ? null : 'seed')}
        className={`tool-btn ${activeTool === 'seed' ? 'active' : ''}`}
        title="种子袋"
      >
        <IconSeedBag />
        {seedCount > 0 && (
          <span className="badge">{seedCount}</span>
        )}
      </button>

      {/* 园艺手套 (收获) */}
      <button
        onClick={() => setActiveTool(activeTool === 'glove' ? null : 'glove')}
        className={`tool-btn ${activeTool === 'glove' ? 'active' : ''}`}
        title="园艺手套"
      >
        <IconGlove />
      </button>

      {/* 嫁接刀 (融合) */}
      <button
        onClick={() => setActiveTool(activeTool === 'knife' ? null : 'knife')}
        className={`tool-btn ${activeTool === 'knife' ? 'active' : ''}`}
        title="嫁接刀"
      >
        <IconKnife />
      </button>

      {/* 分隔 */}
      <div style={{ width: 2, background: 'rgba(141,110,99,0.1)', borderRadius: 1, margin: '0 4px' }} />

      {/* 商店 */}
      {onOpenShop && (
        <button
          onClick={onOpenShop}
          className={`tool-btn ${isPageActive('shop') ? 'active' : ''}`}
          style={!isPageActive('shop') ? { background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)' } : undefined}
          title="种子商店"
        >
          <span style={{ fontSize: 26, lineHeight: 1 }}>🛒</span>
        </button>
      )}

      {/* 仓库 */}
      {onOpenWarehouse && (
        <button
          onClick={onOpenWarehouse}
          className={`tool-btn ${isPageActive('warehouse') ? 'active' : ''}`}
          style={!isPageActive('warehouse') ? { background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)' } : undefined}
          title="仓库"
        >
          <IconWarehouse />
        </button>
      )}

      {/* 稳定工程 */}
      {onOpenFoundation && (
        <button
          onClick={onOpenFoundation}
          className={`tool-btn ${isPageActive('foundation') ? 'active' : ''}`}
          style={!isPageActive('foundation') ? { background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)' } : undefined}
          title="性状稳定工程"
        >
          <IconDNA />
        </button>
      )}
    </div>
  );
};
