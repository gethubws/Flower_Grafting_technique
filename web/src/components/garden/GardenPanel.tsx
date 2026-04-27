import React, { useEffect } from 'react';
import { gardenApi } from '../../api/garden.api';
import { useGardenStore } from '../../stores/garden.store';
import { useFusionStore } from '../../stores/fusion.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';

export const GardenPanel: React.FC = () => {
  const slots = useGardenStore((s) => s.slots);
  const setSlots = useGardenStore((s) => s.setSlots);
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const addToQueue = useFusionStore((s) => s.addToQueue);
  const removeFromQueue = useFusionStore((s) => s.removeFromQueue);

  const refresh = async () => {
    const garden = await gardenApi.getGarden();
    setSlots(garden);
    bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
  };

  useEffect(() => {
    if (slots[0]?.id === null && slots[0]?.flower === null) refresh();
  }, []);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-white">🌻 花园</h2>
        <Button onClick={refresh} variant="secondary" className="text-xs px-2 py-1">
          🔄 刷新
        </Button>
      </div>
      <div className="space-y-1">
        {slots.map((slot) => (
          <div
            key={slot.position}
            className={`flex items-center gap-2 p-2 rounded text-sm ${
              slot.flower ? 'bg-[#1a1a2e] border border-[#0f3460]' : 'bg-transparent border border-dashed border-[#1a1a3e]'
            }`}
          >
            <span className="text-gray-600 w-12 text-xs">#{slot.position + 1}</span>
            {slot.flower ? (
              <>
                <span>{getStageEmoji(slot.flower.stage)}</span>
                <span className="flex-1 text-white truncate text-xs">{slot.flower.name || '-'}</span>
                <span className="text-xs text-gray-500 w-8">{Math.floor(slot.flower.progress)}%</span>
                {slot.flower.stage !== 'BLOOMING' && slot.flower.stage !== 'RECOVERING' && (
                  <Button onClick={() => handleGrow(slot.flower!.id)} variant="secondary" className="text-xs px-1.5 py-0.5">
                    💧
                  </Button>
                )}
                {(slot.flower.stage === 'GROWING' || slot.flower.stage === 'MATURE') && (
                  <Button
                    onClick={() => handleFusionSelect(slot.flower!.id)}
                    variant={fusionQueue.includes(slot.flower!.id) ? 'primary' : 'secondary'}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {fusionQueue.includes(slot.flower!.id) ? '✓' : '⚗️'}
                  </Button>
                )}
              </>
            ) : (
              <span className="text-gray-700 text-xs">空</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
