import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './game/phaser/config';
import { useUserStore } from './stores/user.store';
import { useGardenStore } from './stores/garden.store';
import { useFusionStore } from './stores/fusion.store';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { bridge, BridgeEvent } from './game/bridge';
import { gardenApi } from './api/garden.api';
import { fusionApi } from './api/fusion.api';
import type { PotClickedPayload } from './game/bridge';
import type { GroupedSeedItem, SoilType, FusionResponse } from './types';

import { RegisterPanel } from './components/user/RegisterPanel';
import { Toolbar } from './components/common/Toolbar';
import { ShopPanel } from './components/shop/ShopPanel';
import { GardenPanel } from './components/garden/GardenPanel';
import { FusionPanel } from './components/fusion/FusionPanel';
import { FusionResultModal } from './components/fusion/FusionResultModal';
import { WarehousePanel } from './components/warehouse/WarehousePanel';
import { FoundationPanel } from './components/foundation/FoundationPanel';
import { WarehousePage } from './components/warehouse/WarehousePage';
import { ShopPage } from './components/shop/ShopPage';

type ToolType = 'seed' | 'glove' | 'knife' | null;
type FusionStep = 'selectA' | 'selectB' | 'soil' | null;

const soils: { key: SoilType; name: string; desc: string; emoji: string }[] = [
  { key: 'LOAM', name: '壤土', desc: '基础', emoji: '🟫' },
  { key: 'HUMUS', name: '腐殖土', desc: '奖励+15%', emoji: '🖤' },
  { key: 'SANDY', name: '沙土', desc: '成功率+5%', emoji: '🟨' },
  { key: 'CLAY', name: '粘土', desc: '成功率+10%', emoji: '🟥' },
];

const App: React.FC = () => {
  const gameInstance = useRef<Phaser.Game | null>(null);

  // Toolbar state
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [pickedSeed, setPickedSeed] = useState<GroupedSeedItem | null>(null);

  // Fusion workflow state
  const [fusionStep, setFusionStep] = useState<FusionStep>(null);
  const [fusionParentA, setFusionParentA] = useState<{ id: string; name: string; stage: string } | null>(null);
  const [fusionParentB, setFusionParentB] = useState<{ id: string; name: string; stage: string } | null>(null);
  const [fusionSoil, setFusionSoil] = useState<SoilType>('LOAM');
  const [fusing, setFusing] = useState(false);

  // Panel toggles
  const [currentPage, setCurrentPage] = useState<'garden' | 'warehouse' | 'shop'>('garden');
  const [showShop, setShowShop] = useState(false);
  const [showGardenPanel, setShowGardenPanel] = useState(true);
  const [showFusionPanel, setShowFusionPanel] = useState(false);
  const [showWarehouse, setShowWarehouse] = useState(false);
  const [showFoundation, setShowFoundation] = useState(false);

  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const user = useUserStore((s) => s.user);
  const updateGold = useUserStore((s) => s.updateGold);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);
  const seeds = useGardenStore((s) => s.seedInventory);
  const slots = useGardenStore((s) => s.slots);
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const resultFlower = useFusionStore((s) => s.resultFlower);
  const setResult = useFusionStore((s) => s.setResult);
  const setFusionResponse = useFusionStore((s) => s.setResponse);

  const { loading } = useAuth();
  useSocket(user?.id || null);

  const refreshGarden = useCallback(async () => {
    const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
    setSlots(garden);
    setSeedInventory(inv);
    bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    return { garden, inv };
  }, [setSlots, setSeedInventory]);

  // Init Phaser
  useEffect(() => {
    if (!isLoggedIn || loading || gameInstance.current) return;
    const container = document.getElementById('game-container');
    if (!container) return;
    const config = createGameConfig('game-container');
    gameInstance.current = new Phaser.Game(config);
    setTimeout(async () => { await refreshGarden(); }, 800);
    return () => { gameInstance.current?.destroy(true); gameInstance.current = null; };
  }, [isLoggedIn, loading]);

  // Sync tool to Phaser
  useEffect(() => {
    bridge.emit(BridgeEvent.TOOL_ACTIVATED, { tool: activeTool });
  }, [activeTool]);

  // Reset fusion state when knife tool changes
  useEffect(() => {
    if (activeTool !== 'knife') {
      setFusionStep(null);
      setFusionParentA(null);
      setFusionParentB(null);
      setShowFusionPanel(false);
    } else {
      setFusionStep('selectA');
    }
  }, [activeTool]);

  // Handle pot clicks
  useEffect(() => {
    const handler = async (payload: PotClickedPayload) => {
      // --- Seed planting ---
      if (activeTool === 'seed') {
        const seedToPlant = pickedSeed || (seeds.length > 0 ? seeds[0] : null);
        if (!seedToPlant) return alert('没有种子可以种植');
        if (payload.flower) return alert('这个花盆已经种了花');
        try {
          await gardenApi.plant(seedToPlant.sampleId, payload.position);
          await refreshGarden();
          setPickedSeed(null);
        } catch (e: any) {
          alert(e.response?.data?.message || '种植失败');
        }
        return;
      }

      // --- Glove harvest ---
      if (activeTool === 'glove') {
        if (!payload.flower) return;
        if (payload.flower.stage !== 'BLOOMING') return alert('只有盛放期的花才能收获');
        try {
          const result = await gardenApi.harvest(payload.flowerId!);
          updateGold(result.reward?.gold || 0);
          alert(
            `🧤 收获成功！\n${result.flowerName}\n` +
            `⭐ +${result.reward?.xp || 0}xp  |  🌰 获得种子\n` +
            `📦 花朵已存入仓库，可出售换金币`
          );
          await refreshGarden();
        } catch (e: any) {
          alert(e.response?.data?.message || '收获失败');
        }
        return;
      }

      // --- Knife fusion ---
      if (activeTool === 'knife') {
        if (!payload.flower) return;
        const stage = payload.flower.stage;
        if (stage !== 'GROWING' && stage !== 'MATURE') {
          return alert('只能选择生长期(🌿成长/🌼成熟)的花来嫁接');
        }

        if (fusionStep === 'selectA') {
          setFusionParentA({
            id: payload.flowerId!,
            name: payload.flower.name || '花',
            stage,
          });
          setFusionStep('selectB');
        } else if (fusionStep === 'selectB') {
          if (payload.flowerId === fusionParentA?.id) {
            return alert('不能选择同一朵花');
          }
          setFusionParentB({
            id: payload.flowerId!,
            name: payload.flower.name || '花',
            stage,
          });
          setFusionStep('soil');
          setShowFusionPanel(true);
        }
        return;
      }
    };
    bridge.on(BridgeEvent.POT_CLICKED, handler);
    return () => { bridge.off(BridgeEvent.POT_CLICKED, handler); };
  }, [activeTool, fusionStep, fusionParentA, pickedSeed, seeds]);

  // Execute fusion
  const handleExecuteFusion = async () => {
    if (!fusionParentA || !fusionParentB) return;
    setFusing(true);
    try {
      const res = await fusionApi.fuse({
        parentAId: fusionParentA.id,
        parentBId: fusionParentB.id,
        soil: fusionSoil,
      });

      // Store full response for gene detail modal
      setFusionResponse(res as FusionResponse);

      if (res.success && res.reward) {
        updateGold(res.reward.gold);
        setResult({
          flowerId: res.flowerId || '',
          rarity: res.rarity || 'N',
          atoms: res.atoms || [],
          imageUrl: res.imageUrl || null,
          reward: res.reward,
          isFirstTime: res.isFirstTime || false,
        });

      } else {
        alert(
          `💔 嫁接失败 (${res.failType === 'GRAVE' ? '大失败' : '普通失败'})\n` +
          `亲本「${fusionParentA.name}」已牺牲`
        );
      }

      // Reset
      setFusionParentA(null);
      setFusionParentB(null);
      setFusionStep(null);
      setShowFusionPanel(false);
      setActiveTool(null);
      await refreshGarden();
    } catch (e: any) {
      alert(e.response?.data?.message || '融合失败');
    }
    setFusing(false);
  };

  // Fusion result modal auto-dismiss (kept, modal needs it)
  useEffect(() => {
    if (!resultFlower) return;
    const timer = setTimeout(() => { setResult(null); setFusionResponse(null); }, 10000);
    return () => clearTimeout(timer);
  }, [resultFlower]);

  // Close all overlay panels
  const closeAllPanels = () => {
    setShowShop(false);
    setShowGardenPanel(false);
    setShowWarehouse(false);
    setShowFoundation(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#faf7f2] gap-4">
        <div className="text-4xl animate-bounce-soft">🌺</div>
        <p className="text-[#7a8c6e] text-sm animate-pulse">加载中...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="w-full h-full bg-[#ffffff]">
        <RegisterPanel />
      </div>
    );
  }

  const totalSeeds = seeds.reduce((s, i) => s + i.count, 0);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* ==================== Phaser Canvas (full screen) ==================== */}
      <div id="game-container" className="absolute inset-0" />

      {/* ==================== Top-Left: User Info ==================== */}
      <div className="absolute top-3 left-3 z-20">
        <div className="bg-[#faf7f2]/80 backdrop-blur-md rounded-xl border border-[#c5d5b5]/30 px-3 py-2 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-[#2e3d23] font-bold text-sm">
            {(user?.name || '?')[0]}
          </div>
          <div>
            <div className="text-[#2e3d23] font-bold text-sm leading-tight">{user?.name}</div>
            <div className="text-[#7a8c6e] text-xxs">
              Lv.{user?.level}
              {user?.title && <span className="ml-1 text-purple-700">· {user.title}</span>}
            </div>
          </div>
          <div className="flex gap-2 text-xxs ml-1">
            <span className="text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded">💰 {user?.gold}</span>
            <span className="text-cyan-700 bg-cyan-100/80 px-1.5 py-0.5 rounded">💎 {user?.diamond}</span>
            <span className="text-purple-700 bg-purple-50/80 px-1.5 py-0.5 rounded">⭐ {user?.xp}</span>
          </div>
        </div>
      </div>

      {/* ==================== Top-Right: Panel Toggles ==================== */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button
          onClick={() => { setShowGardenPanel(!showGardenPanel); setShowShop(false); setShowWarehouse(false); setShowFoundation(false); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all ${
            showGardenPanel
              ? 'bg-green-200/80 border border-green-400/40 text-green-700'
              : 'bg-[#faf7f2]/60 border border-[#c5d5b5]/30 text-[#5a6b4c] hover:text-[#2e3d23]'
          }`}
        >
          🌻 花园
        </button>
        <button
          onClick={() => {
            setCurrentPage('shop');
            closeAllPanels();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all bg-[#faf7f2]/60 border border-[#c5d5b5]/30 text-[#5a6b4c] hover:text-[#2e3d23]"
        >
          🛒 商店
        </button>
      </div>

      {/* ==================== Overlay: Garden Panel ==================== */}
      {showGardenPanel && (
        <div className="absolute top-16 right-3 z-20 w-72 max-h-[55vh] overflow-y-auto
                        bg-[#faf7f2]/85 backdrop-blur-lg rounded-xl border border-[#c5d5b5]/30 p-3
                        animate-fade-in shadow-2xl">
          <GardenPanel />
        </div>
      )}

      {/* ==================== Overlay: Shop Panel ==================== */}
      {showShop && (
        <div className="absolute top-16 right-3 z-20 w-72 max-h-[55vh] overflow-y-auto
                        bg-[#faf7f2]/85 backdrop-blur-lg rounded-xl border border-[#c5d5b5]/30 p-3
                        animate-fade-in shadow-2xl">
          <ShopPanel />
        </div>
      )}

      {/* ==================== Overlay: Warehouse Panel (small) ==================== */}
      {showWarehouse && (
        <div className="absolute top-16 right-3 z-20 w-80 max-h-[60vh] overflow-y-auto
                        bg-[#faf7f2]/85 backdrop-blur-lg rounded-xl border border-amber-300/50 p-3
                        animate-fade-in shadow-2xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-amber-700">🏚️ 仓库</h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage('warehouse')} className="text-purple-700 hover:text-purple-600 text-xs">全屏</button>
              <button onClick={() => setShowWarehouse(false)} className="text-[#9aac8a] hover:text-[#2e3d23] text-xs">✕</button>
            </div>
          </div>
          <WarehousePanel />
        </div>
      )}

      {/* ==================== Overlay: Foundation Panel ==================== */}
      {showFoundation && (
        <div className="absolute top-16 right-3 z-20 w-80 max-h-[60vh] overflow-y-auto
                        bg-[#faf7f2]/85 backdrop-blur-lg rounded-xl border border-purple-200/60 p-3
                        animate-fade-in shadow-2xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-purple-600">🧬 性状稳定工程</h3>
            <button onClick={() => setShowFoundation(false)} className="text-[#9aac8a] hover:text-[#2e3d23] text-xs">✕</button>
          </div>
          <FoundationPanel />
        </div>
      )}

      {/* ==================== Fusion Flow Indicator ==================== */}
      {activeTool === 'knife' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-25">
          <div className="bg-[#faf7f2]/90 backdrop-blur-lg rounded-xl border border-purple-300/60 p-4
                          text-center animate-fade-in shadow-2xl min-w-[200px]">
            <div className="text-2xl mb-2">🔪</div>
            {fusionStep === 'selectA' && (
              <>
                <p className="text-[#2e3d23] font-bold text-sm mb-1">选择第一朵花</p>
                <p className="text-red-700 text-xs mb-1">⚠️ 嫁接刀下必有一死</p>
                <p className="text-[#7a8c6e] text-xs">点击花园中生长期的花</p>
              </>
            )}
            {fusionStep === 'selectB' && fusionParentA && (
              <>
                <p className="text-[#2e3d23] font-bold text-sm mb-1">选择第二朵花</p>
                <div className="flex items-center justify-center gap-2 mb-1 text-xs">
                  <span className="text-purple-600">已选：{fusionParentA.name}</span>
                  <span className="text-red-500">🔪必死</span>
                </div>
                <p className="text-[#7a8c6e] text-xs">点击花园中另一朵生长期的花</p>
              </>
            )}
            {fusionStep === 'soil' && showFusionPanel && (
              <FusionSoilPicker
                fusionParentA={fusionParentA}
                fusionParentB={fusionParentB}
                soil={fusionSoil}
                setSoil={setFusionSoil}
                fusing={fusing}
                onFuse={handleExecuteFusion}
                onCancel={() => { setActiveTool(null); }}
              />
            )}
            {!fusionStep && (
              <p className="text-[#7a8c6e] text-xs">准备嫁接...</p>
            )}
          </div>
        </div>
      )}

      {/* Socket toast removed — bloom notification moved to GardenPanel.grow() */}

      {/* ==================== Fusion Result Modal ==================== */}
      <FusionResultModal />

      {/* ==================== Bottom: Toolbar + Seed/Glove/Knife Hints ==================== */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Seed picker */}
        {activeTool === 'seed' && (
          <div className="bg-[#faf7f2]/90 backdrop-blur-md border-t border-amber-300/50 p-2 animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-amber-700 text-xs font-medium">选择种子：</span>
              {seeds.length === 0 ? (
                <span className="text-[#7a8c6e] text-xs">没有种子，去商店购买</span>
              ) : (
                seeds.map((seed) => (
                  <button
                    key={seed.name}
                    onClick={() => setPickedSeed(pickedSeed?.name === seed.name ? null : seed)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      pickedSeed?.name === seed.name
                        ? 'bg-amber-200/80 border border-amber-400 text-amber-700'
                        : 'bg-[#ffffff] border border-[#e8f0e0] text-[#5a6b4c] hover:border-amber-400/50'
                    }`}
                  >
                    <span>🌰</span>
                    <span>{seed.name}</span>
                    <span className="text-amber-500 font-bold">×{seed.count}</span>
                  </button>
                ))
              )}
            </div>
            {pickedSeed && (
              <p className="text-amber-700 text-xs text-center mt-1.5 animate-fade-in">
                👆 已选中「{pickedSeed.name}」，点击花盆种植
              </p>
            )}
          </div>
        )}

        {activeTool === 'glove' && (
          <div className="bg-[#faf7f2]/90 backdrop-blur-md border-t border-green-300/50 p-2 animate-fade-in text-center">
            <p className="text-green-700 text-xs">👆 点击盛放期（🌸）花朵收获 → 花存入仓库</p>
          </div>
        )}

        <Toolbar
          activeTool={activeTool}
          setActiveTool={(t) => { setActiveTool(t); if (t !== 'seed') setPickedSeed(null); }}
          seedCount={totalSeeds}
          onOpenWarehouse={() => setCurrentPage('warehouse')}
          onOpenFoundation={() => {
            closeAllPanels();
            setShowFoundation(!showFoundation);
          }}
        />
      </div>
      {/* ==================== Full-Screen Pages ==================== */}
      {currentPage === 'warehouse' && (
        <WarehousePage onClose={() => setCurrentPage('garden')} />
      )}
      {currentPage === 'shop' && (
        <ShopPage onClose={() => setCurrentPage('garden')} />
      )}
    </div>
  );
};

// ========== Inline Fusion Soil Picker (shown in fusion flow popup) ==========

const FusionSoilPicker: React.FC<{
  fusionParentA: { name: string } | null;
  fusionParentB: { name: string } | null;
  soil: SoilType;
  setSoil: (s: SoilType) => void;
  fusing: boolean;
  onFuse: () => void;
  onCancel: () => void;
}> = ({ fusionParentA, fusionParentB, soil, setSoil, fusing, onFuse, onCancel }) => (
  <div className="animate-fade-in">
    <div className="flex items-center justify-center gap-2 mb-3 text-xs">
      <span className="text-red-700">{fusionParentA?.name} 🔪</span>
      <span className="text-purple-700">×</span>
      <span className="text-[#2e3d23]">{fusionParentB?.name}</span>
    </div>

    <p className="text-[#5a6b4c] text-xs mb-2">选择土壤：</p>
    <div className="grid grid-cols-2 gap-1.5 mb-3">
      {soils.map((s) => (
        <button
          key={s.key}
          onClick={() => setSoil(s.key)}
          className={`text-left p-1.5 rounded-lg text-xs transition-all ${
            soil === s.key
              ? 'bg-purple-200/80 border border-purple-400 text-[#2e3d23]'
              : 'bg-[#ffffff] border border-[#e8f0e0] text-[#7a8c6e] hover:border-purple-900/50'
          }`}
        >
          <span className="mr-1">{s.emoji}</span>
          <span className="font-medium">{s.name}</span>
          <span className="text-[#b0c2a0] ml-1">{s.desc}</span>
        </button>
      ))}
    </div>

    <div className="flex gap-2">
      <button onClick={onCancel} className="flex-1 py-1.5 rounded-lg bg-[#ffffff] text-[#5a6b4c] text-xs hover:text-[#2e3d23]">
        取消
      </button>
      <button
        onClick={onFuse}
        disabled={fusing}
        className="flex-1 py-1.5 rounded-lg bg-green-600 text-[#2e3d23] text-xs font-bold hover:bg-green-500 disabled:opacity-50"
      >
        {fusing ? '⚗️ 融合中...' : '✨ 开始嫁接'}
      </button>
    </div>
  </div>
);

export default App;
