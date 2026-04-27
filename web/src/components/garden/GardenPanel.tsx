import React, { useEffect, useState } from 'react';
import { gardenApi } from '../../api/garden.api';
import { useGardenStore } from '../../stores/garden.store';
import { useFusionStore } from '../../stores/fusion.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';
import type { GroupedSeedItem } from '../../types';

export const GardenPanel: React.FC = () => {
  const slots = useGardenStore((s) => s.slots);
  const seeds = useGardenStore((s) => s.seedInventory);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const addToQueue = useFusionStore((s) => s.addToQueue);
  const removeFromQueue = useFusionStore((s) => s.removeFromQueue);
  const [planting, setPlanting] = useState<string | null>(null);

  const refresh = async () => {
    const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
    setSlots(garden);
    setSeedInventory(inv);
    bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
  };

  useEffect(() => { refresh(); }, []);

  const handlePlant = async (seedItem: GroupedSeedItem) => {
    setPlanting(seedItem.name);
    try {
      await gardenApi.plant(seedItem.sampleId);
      await refresh();
    } catch (e: any) {
      alert(e.response?.data?.message || '种植失败');
    }
    setPlanting(null);
  };

  const handleGrow = async (flowerId: string) => {
    await gardenApi.grow(flowerId);
    await refresh();
  };

  const handleHarvest = async (flowerId: string) => {
    try {
      const result = await gardenApi.harvest(flowerId);
      alert(`🎉 收获成功！\n${result.flowerName}\n💰 +${result.reward.gold}g  ⭐ +${result.reward.xp}xp`);
      await refresh();
    } catch (e: any) {
      alert(e.response?.data?.message || '收获失败');
    }
  };

  const handleFusionSelect = (flowerId: string) => {
    if (fusionQueue.includes(flowerId)) removeFromQueue(flowerId);
    else addToQueue(flowerId);
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
      {/* Seed Inventory */}
      {seeds.length > 0 && (
        <div className="mb-3 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-2">
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
              <Button onClick={() => handlePlant(seed)} disabled={planting === seed.name} size="xs" variant="success">
                {planting === seed.name ? '...' : '🌱 种植'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Garden Slots */}
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
                {/* Progress bar */}
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${slot.flower.progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="flex-1 text-gray-700 text-xs">空槽位</span>
            )}

            {slot.flower && slot.flower.stage !== 'BLOOMING' && slot.flower.stage !== 'RECOVERING' && (
              <Button onClick={() => handleGrow(slot.flower!.id)} variant="secondary" size="xs">💧</Button>
            )}
            {slot.flower && slot.flower.stage === 'BLOOMING' && (
              <Button onClick={() => handleHarvest(slot.flower!.id)} variant="success" size="xs">🎁</Button>
            )}
            {slot.flower && (slot.flower.stage === 'GROWING' || slot.flower.stage === 'MATURE') && (
              <Button
                onClick={() => handleFusionSelect(slot.flower!.id)}
                variant={fusionQueue.includes(slot.flower!.id) ? 'primary' : 'secondary'}
                size="xs"
                className={fusionQueue.includes(slot.flower!.id) ? 'animate-pulse-glow !bg-purple-700' : ''}
              >
                {fusionQueue.includes(slot.flower!.id) ? '✓' : '⚗️'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
