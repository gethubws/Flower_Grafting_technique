import React, { useEffect } from 'react';
import { gardenApi } from '../../api/garden.api';
import { useGardenStore } from '../../stores/garden.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';

export const GardenPanel: React.FC = () => {
  const slots = useGardenStore((s) => s.slots);
  const seeds = useGardenStore((s) => s.seedInventory);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);

  const refresh = async () => {
    const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
    setSlots(garden);
    setSeedInventory(inv);
    bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
  };

  useEffect(() => { refresh(); }, []);

  const handleGrow = async (flowerId: string) => {
    const result = await gardenApi.grow(flowerId);
    await refresh();
    // MATURE→BLOOMING：盛放提醒
    if (result.stageChanged && result.flower.stage === 'BLOOMING') {
      alert(
        `🌸 花开了！
` +
        `「${result.flower.name || '花'}」进入盛放期
` +
        (result.bloomingImageApplied ? '🖼️ 盛放形态已就绪
' : '') +
        `🧤 可用园艺手套收获 → 存入仓库`
      );
    }
  };

  const getStageEmoji = (stage: string) => {
    const m: Record<string, string> = { SEED: '🌰', SEEDLING: '🌱', GROWING: '🌿', MATURE: '🌼', BLOOMING: '🌸', RECOVERING: '💤' };
    return m[stage] || '❓';
  };
  const getStageLabel = (stage: string) => {
    const m: Record<string, string> = { SEED: '种子', SEEDLING: '幼苗', GROWING: '成长', MATURE: '成熟', BLOOMING: '盛放', RECOVERING: '休养' };
    return m[stage] || stage;
  };
  const getRarityClass = (rarity: string) => `rarity-${rarity}`;

  return (
    <div className="animate-fade-in">
      {/* Seed count */}
      {seeds.length > 0 && (
        <div className="mb-3 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-amber-400 text-sm">🌰</span>
            <span className="text-sm font-semibold text-amber-400">种子库存</span>
            <span className="text-amber-600 text-xs">({seeds.reduce((s, i) => s + i.count, 0)}颗)</span>
          </div>
          {seeds.map((seed) => (
            <div key={seed.name} className="card p-2 flex items-center gap-2 mb-1 bg-amber-900/10 border-amber-800/20">
              <span className="text-lg">🌰</span>
              <span className="flex-1 text-white text-xs">{seed.name}</span>
              <span className="text-amber-400 text-xs font-bold bg-amber-900/40 px-1.5 py-0.5 rounded-full">
                ×{seed.count}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌻</span>
          <h2 className="text-lg font-bold text-white">花园</h2>
          <span className="text-gray-600 text-xs">({slots.filter(s => s.flower).length}/6)</span>
        </div>
        <Button onClick={refresh} variant="secondary" size="xs">🔄</Button>
      </div>

      <div className="space-y-1.5">
        {slots.map((slot) => (
          <div
            key={slot.position}
            className={`card p-2.5 flex items-center gap-2 text-sm transition-all ${
              slot.flower ? getRarityClass(slot.flower.rarity) : 'border-dashed opacity-60'
            }`}
          >
            <span className={`text-xs w-7 h-7 flex items-center justify-center rounded-full ${
              slot.flower ? 'bg-[#1a1a3e] text-gray-400' : 'bg-transparent text-gray-600'
            }`}>
              {slot.position + 1}
            </span>

            {slot.flower ? (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{getStageEmoji(slot.flower.stage)}</span>
                  <span className="text-white font-medium text-xs truncate">{slot.flower.name}</span>
                  <span className={`stage-badge stage-${slot.flower.stage} ml-auto`}>
                    {getStageLabel(slot.flower.stage)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${slot.flower.progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="flex-1 text-gray-700 text-xs">空槽位 — 工具栏播种</span>
            )}

            {slot.flower && slot.flower.stage !== 'BLOOMING' && slot.flower.stage !== 'RECOVERING' && (
              <Button onClick={() => handleGrow(slot.flower!.id)} variant="secondary" size="xs">💧</Button>
            )}
            {slot.flower && slot.flower.stage === 'BLOOMING' && (
              <span className="text-pink-400 text-xs">🧤可收获</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
