import { showToast } from '../common/Toast';
import React, { useState } from 'react';
import { fusionApi } from '../../api/fusion.api';
import { gardenApi } from '../../api/garden.api';
import { useFusionStore } from '../../stores/fusion.store';
import { useGardenStore } from '../../stores/garden.store';
import { useUserStore } from '../../stores/user.store';
import { bridge, BridgeEvent } from '../../game/bridge';
import { Button } from '../common/Button';

type SoilType = 'LOAM' | 'HUMUS' | 'SANDY' | 'CLAY';

const soils: { key: SoilType; name: string; desc: string; emoji: string }[] = [
  { key: 'LOAM', name: '壤土', desc: '基础土壤', emoji: '🟫' },
  { key: 'HUMUS', name: '腐殖土', desc: '价值+15%', emoji: '🖤' },
  { key: 'SANDY', name: '沙土', desc: '成功率+5%', emoji: '🟨' },
  { key: 'CLAY', name: '粘土', desc: '成功率+10%', emoji: '🟥' },
];

export const FusionPanel: React.FC = () => {
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const clearQueue = useFusionStore((s) => s.clearQueue);
  const setResult = useFusionStore((s) => s.setResult);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);
  const updateGold = useUserStore((s) => s.updateGold);
  const [soil, setSoil] = useState<SoilType>('LOAM');
  const [fusing, setFusing] = useState(false);

  if (fusionQueue.length === 0) return null;

  const handleFusion = async () => {
    if (fusionQueue.length < 2) return;
    setFusing(true);
    try {
      const res = await fusionApi.fuse({
        parentAId: fusionQueue[0],
        parentBId: fusionQueue[1],
        soil,
      });
      if (res.success && res.reward) {
        updateGold(res.reward.gold);
      }
      setResult({
        flowerId: res.flowerId || '',
        rarity: res.rarity || 'N',
        atoms: res.atoms || [],
        imageUrl: res.imageUrl || null,
        reward: res.reward || { gold: 0, xp: 0 },
        isFirstTime: res.isFirstTime || false,
      });
      clearQueue();
      const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
      setSlots(garden);
      setSeedInventory(inv);
      bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    } catch (e: any) {
      showToast(e.response?.data?.message || '融合失败', 'error')
    }
    setFusing(false);
  };

  return (
    <div className="card p-3 animate-fade-in animate-pulse-glow">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚗️</span>
        <span className="text-[#2e3d23] font-bold text-sm">嫁接融合</span>
        <span className="text-purple-700 text-xs ml-auto">{fusionQueue.length}/2</span>
      </div>

      {/* Soil selection */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {soils.map((s) => (
          <button
            key={s.key}
            onClick={() => setSoil(s.key)}
            className={`text-left p-1.5 rounded-lg text-xs transition-all ${
              soil === s.key
                ? 'bg-purple-200/80 border border-purple-400 text-[#2e3d23]'
                : 'bg-[#ffffff] border border-[#e8f0e0] text-[#7a8c6e] hover:border-[#66bb6a]'
            }`}
          >
            <span className="mr-1">{s.emoji}</span>
            <span className="font-medium">{s.name}</span>
            <span className="block text-[#9aac8a] ml-4">{s.desc}</span>
          </button>
        ))}
      </div>

      <Button
        onClick={handleFusion}
        disabled={fusionQueue.length < 2 || fusing}
        variant="primary"
        className="w-full"
      >
        {fusing ? '⚗️ 融合中...' : '✨ 开始融合'}
      </Button>
    </div>
  );
};
