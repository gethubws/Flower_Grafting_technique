import React, { useEffect, useState } from 'react';
import { gardenApi } from '../../api/garden.api';
import { useGardenStore } from '../../stores/garden.store';
import { useFusionStore } from '../../stores/fusion.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';
import type { GroupedSeedItem } from '../../types';

export const GardenPanel: React.FC = () => {
  const slots = useGardenStore((s) => s.slots);
  const setSlots = useGardenStore((s) => s.setSlots);
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const addToQueue = useFusionStore((s) => s.addToQueue);
  const removeFromQueue = useFusionStore((s) => s.removeFromQueue);
  const [seeds, setSeeds] = useState<GroupedSeedItem[]>([]);
  const [planting, setPlanting] = useState<string | null>(null);

  const refresh = async () => {
    const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
    setSlots(garden);
    setSeeds(inv);
    bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handlePlant = async (seedItem: GroupedSeedItem) => {
    // 找第一个空槽位
    const emptySlot = slots.find((s) => !s.flower);
    if (!emptySlot) return alert('花园已满，没有空槽位了');

    setPlanting(seedItem.name);
    try {
      await gardenApi.plant(seedItem.sampleId, emptySlot.position);
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

  const handleFusionSelect = (flowerId: string) => {
    if (fusionQueue.includes(flowerId)) {
      removeFromQueue(flowerId);
    } else {
      addToQueue(flowerId);
    }
  };

  const getStageEmoji = (stage: string) => {
    const map: Record<string, string> = {
      SEED: '🌰', SEEDLING: '🌱', GROWING: '🌿', MATURE: '🌼', BLOOMING: '🌸', RECOVERING: '💤',
    };
    return map[stage] || '❓';
  };

  const getStageLabel = (stage: string) => {
    const map: Record<string, string> = {
      SEED: '种子', SEEDLING: '幼苗', GROWING: '成长', MATURE: '成熟', BLOOMING: '开花', RECOVERING: '休养',
    };
    return map[stage] || stage;
  };

  return (
    <div>
      {/* Seed Inventory */}
      {seeds.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">🌰 种子库存</h3>
          {seeds.map((seed) => (
            <div key={seed.name} className="flex items-center gap-2 p-2 rounded bg-amber-900/20 border border-amber-800/30 mb-1 text-sm">
              <span>🌰</span>
              <span className="flex-1 text-white text-xs">{seed.name}</span>
              <span className="text-amber-400 text-xs font-bold bg-amber-900/40 px-1.5 py-0.5 rounded">×{seed.count}</span>
              <Button
                onClick={() => handlePlant(seed)}
                disabled={planting === seed.name}
                variant="primary"
                className="text-xs px-2 py-0.5"
              >
                {planting === seed.name ? '...' : '🌱 种植'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Garden Slots */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-white">🌻 花园</h2>
        <Button onClick={refresh} variant="secondary" className="text-xs px-2 py-1">🔄 刷新</Button>
      </div>
      <div className="space-y-1">
        {slots.map((slot) => (
          <div
            key={slot.position}
            className={`flex items-center gap-2 p-2 rounded text-sm ${
              slot.flower ? 'bg-[#1a1a2e] border border-[#0f3460]' : 'bg-transparent border border-dashed border-[#1a1a3e]'
            }`}
          >
            <span className="text-gray-600 w-8 text-xs">#{slot.position + 1}</span>
            {slot.flower ? (
              <>
                <span className="text-lg">{getStageEmoji(slot.flower.stage)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs truncate">{slot.flower.name}</div>
                  <div className="text-gray-600 text-[10px]">{getStageLabel(slot.flower.stage)} · {Math.floor(slot.flower.progress)}%</div>
                </div>
                {slot.flower.stage !== 'BLOOMING' && slot.flower.stage !== 'RECOVERING' && (
                  <Button onClick={() => handleGrow(slot.flower!.id)} variant="secondary" className="text-xs px-2 py-0.5">
                    💧
                  </Button>
                )}
                {(slot.flower.stage === 'GROWING' || slot.flower.stage === 'MATURE') && (
                  <Button
                    onClick={() => handleFusionSelect(slot.flower!.id)}
                    variant={fusionQueue.includes(slot.flower!.id) ? 'primary' : 'secondary'}
                    className="text-xs px-2 py-0.5"
                  >
                    {fusionQueue.includes(slot.flower!.id) ? '✓' : '⚗️'}
                  </Button>
                )}
              </>
            ) : (
              <span className="text-gray-700 text-xs flex-1">空槽位</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
