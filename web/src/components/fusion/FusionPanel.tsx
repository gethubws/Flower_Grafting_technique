import React from 'react';
import { fusionApi } from '../../api/fusion.api';
import { gardenApi } from '../../api/garden.api';
import { useUserStore } from '../../stores/user.store';
import { useGardenStore } from '../../stores/garden.store';
import { useFusionStore } from '../../stores/fusion.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';
import type { FusionResponse } from '../../types';

export const FusionPanel: React.FC = () => {
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const clearQueue = useFusionStore((s) => s.clearQueue);
  const setResponse = useFusionStore((s) => s.setResponse);
  const isFusing = useFusionStore((s) => s.isFusing);
  const setFusing = useFusionStore((s) => s.setFusing);
  const slots = useGardenStore((s) => s.slots);
  const updateGold = useUserStore((s) => s.updateGold);

  if (fusionQueue.length < 2) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        {fusionQueue.length === 0
          ? '拖拽或点击 ⚗️ 选择两株花进行嫁接'
          : `已选 ${fusionQueue.length}/2 — 再选一株`}
      </div>
    );
  }

  const flowerA = slots.find((s) => s.flower?.id === fusionQueue[0])?.flower;
  const flowerB = slots.find((s) => s.flower?.id === fusionQueue[1])?.flower;

  const handleFuse = async (soil: string) => {
    setFusing(true);
    try {
      const res: FusionResponse = await fusionApi.fuse({
        parentAId: fusionQueue[0],
        parentBId: fusionQueue[1],
        soil: soil as any,
      });
      setResponse(res);
      if (res.success) {
        if (res.reward) updateGold(res.reward.gold);
        clearQueue();
        // Refresh
        const garden = await gardenApi.getGarden();
        useGardenStore.getState().setSlots(garden);
        bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || '嫁接失败');
    }
    setFusing(false);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3">⚗️ 嫁接操作</h2>
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-xl">{flowerA?.name?.slice(0, 4) || '?'}</span>
        <span className="text-2xl">×</span>
        <span className="text-xl">{flowerB?.name?.slice(0, 4) || '?'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { soil: 'LOAM', name: '壤土', desc: '标准' },
          { soil: 'HUMUS', name: '腐殖土', desc: '价值+15%' },
          { soil: 'SANDY', name: '沙土', desc: '成功率+5%' },
          { soil: 'CLAY', name: '粘土', desc: '成功率+10%' },
        ].map((s) => (
          <Button
            key={s.soil}
            onClick={() => handleFuse(s.soil)}
            disabled={isFusing}
            variant="secondary"
            className="text-xs"
          >
            {s.name}
            <br />
            <span className="text-gray-500">{s.desc}</span>
          </Button>
        ))}
      </div>
      <Button onClick={clearQueue} variant="danger" disabled={isFusing} className="w-full">
        取消选择
      </Button>
    </div>
  );
};
