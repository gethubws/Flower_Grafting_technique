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
import type { PotClickedPayload, PotDetailTogglePayload } from './game/bridge';
import type { GroupedSeedItem, SoilType, FusionResponse } from './types';
import { FlowerDetailPopup } from './components/garden/FlowerDetailPopup';
import { ToastProvider, useToast } from './components/common/Toast';

import { RegisterPanel } from './components/user/RegisterPanel';
import { Toolbar } from './components/common/Toolbar';
import { IconCoin, IconGem, IconStar } from './components/common/GameIcons';
import { ShopPanel } from './components/shop/ShopPanel';
import { GardenPanel } from './components/garden/GardenPanel';
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

  // Detail popup state
  const [detailPopup, setDetailPopup] = useState<PotDetailTogglePayload | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setDetailPopup(null);
      closeTimerRef.current = null;
    }, 150);
  };
  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

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
  const resultFlower = useFusionStore((s) => s.resultFlower);
  const setResult = useFusionStore((s) => s.setResult);
  const setFusionResponse = useFusionStore((s) => s.setResponse);

  const { loading } = useAuth();
  useSocket(user?.id || null);
  const toast = useToast().toast;

  const refreshGarden = useCallback(async () => {
    console.time('[refreshGarden]');
    const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
    console.timeEnd('[refreshGarden]');
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
  useEffect(() => { bridge.emit(BridgeEvent.TOOL_ACTIVATED, { tool: activeTool }); }, [activeTool]);

  // Hover tooltip for pots
  useEffect(() => {
    const enter = (payload: PotDetailTogglePayload) => {
      cancelClose();
      setDetailPopup(payload);
    };
    const leave = () => {
      scheduleClose();
    };
    bridge.on(BridgeEvent.POT_HOVER_ENTER, enter);
    bridge.on(BridgeEvent.POT_HOVER_LEAVE, leave);
    return () => {
      bridge.off(BridgeEvent.POT_HOVER_ENTER, enter);
      bridge.off(BridgeEvent.POT_HOVER_LEAVE, leave);
    };
  }, []);

  // Reset fusion state when knife tool changes
  useEffect(() => {
    if (activeTool !== 'knife') { setFusionStep(null); setFusionParentA(null); setFusionParentB(null); setShowFusionPanel(false); }
    else { setFusionStep('selectA'); }
  }, [activeTool]);

  // Handle pot clicks
  useEffect(() => {
    const handler = async (payload: PotClickedPayload) => {
      if (activeTool === 'seed') {
        const seedToPlant = pickedSeed || (seeds.length > 0 ? seeds[0] : null);
        if (!seedToPlant) return toast('没有种子可以种植', 'error');
        if (payload.flower) return toast('这个花盆已经种了花', 'error');
        try {
          await gardenApi.plant(seedToPlant.sampleId, payload.position);
          await refreshGarden();
          setPickedSeed(null);
        } catch (e: any) { toast(e.response?.data?.message || '种植失败', 'error'); }
        return;
      }
      if (activeTool === 'glove') {
        if (!payload.flower) return;
        if (payload.flower.stage !== 'BLOOMING') return toast('只有盛放期的花才能收获', 'error');
        try {
          const result = await gardenApi.harvest(payload.flowerId!);
          updateGold(result.reward?.gold || 0);
          toast(`${(result as any).seedDropped ? '🌰 获得种子  |  ' : ''}📦 ${result.flowerName} 已存入仓库`, result.reward?.xp ? 'success' : 'info');
          await refreshGarden();
        } catch (e: any) { toast(e.response?.data?.message || '收获失败', 'error'); }
        return;
      }
      if (activeTool === 'knife') {
        if (!payload.flower) return;
        const stage = payload.flower.stage;
        if (stage !== 'GROWING' && stage !== 'MATURE') return toast('只能选择生长期(🌿成长/🌼成熟)的花来嫁接', 'error');
        if (fusionStep === 'selectA') {
          setFusionParentA({ id: payload.flowerId!, name: payload.flower.name || '花', stage });
          setFusionStep('selectB');
        } else if (fusionStep === 'selectB') {
          if (payload.flowerId === fusionParentA?.id) return toast('不能选择同一朵花', 'error');
          setFusionParentB({ id: payload.flowerId!, name: payload.flower.name || '花', stage });
          setFusionStep('soil');
          setShowFusionPanel(true);
        }
        return;
      }
    };
    bridge.on(BridgeEvent.POT_CLICKED, handler);
    return () => { bridge.off(BridgeEvent.POT_CLICKED, handler); };
  }, [activeTool, fusionStep, fusionParentA, pickedSeed, seeds]);

  const handleExecuteFusion = async () => {
    if (!fusionParentA || !fusionParentB) return;
    setFusing(true);
    try {
      const res = await fusionApi.fuse({ parentAId: fusionParentA.id, parentBId: fusionParentB.id, soil: fusionSoil });
      setFusionResponse(res as FusionResponse);
      if (res.success && res.reward) {
        updateGold(res.reward.gold);
        setResult({ flowerId: res.flowerId || '', rarity: res.rarity || 'N', atoms: res.atoms || [], imageUrl: res.imageUrl || null, reward: res.reward, isFirstTime: res.isFirstTime || false });
      } else { toast(`💔 嫁接失败 (${res.failType === 'GRAVE' ? '大失败' : '普通失败'})\n亲本「${fusionParentA.name}」已牺牲`, 'error'); }
      setFusionParentA(null); setFusionParentB(null); setFusionStep(null); setShowFusionPanel(false); setActiveTool(null);
      await refreshGarden();
    } catch (e: any) { toast(e.response?.data?.message || '融合失败', 'error'); }
    setFusing(false);
  };

  // Detail popup handlers
  const handleWaterFromPopup = async (flowerId: string) => {
    try {
      await gardenApi.grow(flowerId);
      await refreshGarden();
    } catch (e: any) { toast(e.response?.data?.message || '浇水失败', 'error'); }
  };
  const handleHarvestFromPopup = async (flowerId: string) => {
    try {
      console.log('[harvest] start:', flowerId);
      const result = await gardenApi.harvest(flowerId);
      console.log('[harvest] done:', result);
      updateGold(result.reward?.gold || 0);
      toast(`${(result as any).seedDropped ? '🌰 获得种子  |  ' : ''}📦 ${result.flowerName} 已存入仓库`, 'success');
      await refreshGarden();
      console.log('[harvest] garden refreshed');
      setDetailPopup(null);
    } catch (e: any) { console.error('[harvest] error:', e); toast(e.response?.data?.message || '收获失败', 'error'); }
  };

  useEffect(() => {
    if (!resultFlower) return;
    const timer = setTimeout(() => { setResult(null); setFusionResponse(null); }, 10000);
    return () => clearTimeout(timer);
  }, [resultFlower]);

  const closeAllPanels = () => { setShowShop(false); setShowGardenPanel(false); setShowWarehouse(false); setShowFoundation(false); };

  if (loading) {
    return (
      <ToastProvider>
      <div className="flex flex-col items-center justify-center w-full h-full gap-4" style={{ background: 'linear-gradient(180deg, #f5f9f3, #FAF8F5, #fdf5eb)' }}>
        <div className="text-4xl animate-float">🌺</div>
        <p className="text-[#8D6E63] text-sm font-medium">加载中...</p>
      </div>
      </ToastProvider>
    );
  }

  if (!isLoggedIn) {
    return (
      <ToastProvider>
      <div className="w-full h-full" style={{ background: 'linear-gradient(180deg, #f5f9f3, #FAF8F5, #fdf5eb)' }}>
        <RegisterPanel />
      </div>
      </ToastProvider>
    );
  }

  const totalSeeds = seeds.reduce((s, i) => s + i.count, 0);

  return (
    <ToastProvider>
    <div className="relative w-full h-full overflow-hidden">
      {/* ==================== Phaser Canvas ==================== */}
      <div id="game-container" className="absolute inset-0" />

      {/* ==================== Top Bar (悬浮胶囊) ==================== */}
      <div className="top-bar" style={{ position: 'absolute', top: 16, left: 16, right: 'auto', transform: 'none', zIndex: 50 }}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
          {(user?.name || '?')[0]}
        </div>
        <div>
          <div className="text-[#3E2723] font-bold text-sm leading-tight">{user?.name}</div>
          <div className="text-[#8D6E63] text-xs">
            Lv.{user?.level}
            {user?.title && <span className="ml-1" style={{ color: '#7B1FA2' }}>· {user.title}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="top-stat stat-gold"><IconCoin size={18} /> {user?.gold}</div>
          <div className="top-stat stat-gem"><IconGem size={18} /> {user?.diamond}</div>
          <div className="top-stat stat-xp"><IconStar size={18} /> {user?.xp}</div>
        </div>
      </div>

      {/* ==================== Top-Right: Quick Toggles ==================== */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button
          onClick={() => { setShowGardenPanel(!showGardenPanel); setShowShop(false); setShowWarehouse(false); setShowFoundation(false); }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold backdrop-blur-md transition-all border ${
            showGardenPanel ? 'glass-card border-green-300 text-green-700' : 'text-[#6D4C41]'
          }`}
          style={!showGardenPanel ? { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)' } : { border: '1px solid rgba(124,179,66,0.4)' }}
        >🌻 花园</button>
        <button
          onClick={() => { setCurrentPage('shop'); closeAllPanels(); }}
          className="px-4 py-2 rounded-2xl text-xs font-bold text-[#6D4C41] backdrop-blur-md transition-all"
          style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.8)' }}
        >🛒 商店</button>
      </div>

      {/* ==================== Overlay: Garden Panel ==================== */}
      {showGardenPanel && (
        <div className="glass-card absolute top-20 right-3 z-20 w-72 max-h-[55vh] overflow-y-auto animate-slide-right">
          <GardenPanel />
        </div>
      )}

      {/* ==================== Overlay: Shop Panel (small) ==================== */}
      {showShop && (
        <div className="glass-card absolute top-20 right-3 z-20 w-72 max-h-[55vh] overflow-y-auto animate-slide-right">
          <ShopPanel />
        </div>
      )}

      {/* ==================== Overlay: Warehouse Panel (small) ==================== */}
      {showWarehouse && (
        <div className="glass-card absolute top-20 right-3 z-20 w-80 max-h-[60vh] overflow-y-auto animate-slide-right">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold" style={{ color: '#E65100' }}>🏚️ 仓库</h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage('warehouse')} className="text-[#6D4C41] hover:text-[#3E2723] text-xs font-medium">全屏</button>
              <button onClick={() => setShowWarehouse(false)} className="text-[#8D6E63] hover:text-[#3E2723] text-xs">✕</button>
            </div>
          </div>
          <WarehousePanel />
        </div>
      )}

      {/* ==================== Overlay: Foundation Panel ==================== */}
      {showFoundation && (
        <div className="glass-card absolute top-20 right-3 z-20 w-80 max-h-[60vh] overflow-y-auto animate-slide-right">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold" style={{ color: '#7B1FA2' }}>🧬 性状稳定工程</h3>
            <button onClick={() => setShowFoundation(false)} className="text-[#8D6E63] hover:text-[#3E2723] text-xs">✕</button>
          </div>
          <FoundationPanel />
        </div>
      )}

      {/* ==================== Fusion Flow Indicator ==================== */}
      {activeTool === 'knife' && (
        <div className="absolute top-1/2 left-1/2 z-25" style={{ transform: 'translate(-50%, -50%)' }}>
          <div className="glass-card text-center min-w-[220px]">
            <div className="text-2xl mb-2">🔪</div>
            {fusionStep === 'selectA' && (
              <>
                <p className="text-[#3E2723] font-bold text-sm mb-1">选择第一朵花</p>
                <p className="text-red-700 text-xs mb-1">⚠️ 嫁接刀下必有一死</p>
                <p className="text-[#8D6E63] text-xs">点击花园中生长期的花</p>
              </>
            )}
            {fusionStep === 'selectB' && fusionParentA && (
              <>
                <p className="text-[#3E2723] font-bold text-sm mb-1">选择第二朵花</p>
                <div className="flex items-center justify-center gap-2 mb-1 text-xs">
                  <span className="text-purple-700">已选：{fusionParentA.name}</span>
                  <span className="text-red-500">🔪必死</span>
                </div>
                <p className="text-[#8D6E63] text-xs">点击花园中另一朵生长期的花</p>
              </>
            )}
            {fusionStep === 'soil' && showFusionPanel && (
              <FusionSoilPicker fusionParentA={fusionParentA} fusionParentB={fusionParentB} soil={fusionSoil} setSoil={setFusionSoil} fusing={fusing} onFuse={handleExecuteFusion} onCancel={() => { setActiveTool(null); }} />
            )}
            {!fusionStep && (<p className="text-[#8D6E63] text-xs">准备嫁接...</p>)}
          </div>
        </div>
      )}

      {/* Flower Detail Popup */}
      {detailPopup && (
        <FlowerDetailPopup
          flower={detailPopup.flower}
          screenX={detailPopup.screenX}
          screenY={detailPopup.screenY}
          onClose={() => setDetailPopup(null)}
          onPopupEnter={cancelClose}
          onWater={activeTool === null ? handleWaterFromPopup : undefined}
          onHarvest={activeTool === 'glove' ? handleHarvestFromPopup : undefined}
        />
      )}

      {/* Fusion Result Modal */}
      <FusionResultModal />

      {/* ==================== Bottom: Seed/Glove Hints + Toolbar ==================== */}
      <div className="absolute left-0 right-0 z-[110]" style={{ bottom: 88 }}>
        {activeTool === 'seed' && (
          <div className="text-center pb-3 animate-fade-in">
            {seeds.length === 0 ? (
              <div className="inline-flex items-center gap-2 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
                <span className="text-[#8D6E63] text-sm">暂无种子，去 🛒 商店购买</span>
              </div>
            ) : (
              <div className="px-4">
                <p className="text-[#6D4C41] text-sm font-bold mb-2">🌱 选择种子</p>
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  {seeds.map((seed) => (
                    <button
                      key={seed.name}
                      onClick={() => setPickedSeed(pickedSeed?.name === seed.name ? null : seed)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 min-w-[120px] ${
                        pickedSeed?.name === seed.name
                          ? 'bg-white border-amber-400 text-amber-700 shadow-lg scale-105'
                          : 'bg-white/75 border-white/60 text-[#6D4C41] hover:border-amber-200 hover:shadow-md hover:scale-105'
                      }`}
                      style={{ backdropFilter: 'blur(8px)' }}
                    >
                      <span className="text-2xl">🌰</span>
                      <div className="text-left">
                        <div className="text-sm leading-tight">{seed.name}</div>
                        <div className="text-amber-500 text-xs">×{seed.count} 颗</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pickedSeed && (
              <p className="text-amber-700 text-sm text-center mt-2 animate-fade-in font-medium">
                👆 已选中「{pickedSeed.name}」，点击花盆种植
              </p>
            )}
          </div>
        )}
        {activeTool === 'glove' && (
          <div className="text-center pb-3 animate-fade-in">
            <span className="inline-block p-2 rounded-2xl text-green-700 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
              👆 点击盛放期（🌸）花朵收获 → 花存入仓库
            </span>
          </div>
        )}

        <Toolbar
          activeTool={activeTool}
          setActiveTool={(t) => { setActiveTool(t); if (t !== 'seed') setPickedSeed(null); }}
          seedCount={totalSeeds}
          onOpenWarehouse={() => setCurrentPage('warehouse')}
          onOpenShop={() => setCurrentPage('shop')}
          onOpenFoundation={() => { closeAllPanels(); setShowFoundation(!showFoundation); }}
          currentPage={currentPage}
        />
      </div>

      {/* ==================== Full-Screen Pages ==================== */}
      {currentPage === 'warehouse' && (<WarehousePage onClose={() => setCurrentPage('garden')} />)}
      {currentPage === 'shop' && (<ShopPage onClose={() => setCurrentPage('garden')} />)}
    </div>
    </ToastProvider>
  );
};

// ========== Inline Fusion Soil Picker ==========

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
      <span className="text-[#3E2723]">{fusionParentB?.name}</span>
    </div>
    <p className="text-[#6D4C41] text-xs mb-2">选择土壤：</p>
    <div className="grid grid-cols-2 gap-1.5 mb-3">
      {soils.map((s) => (
        <button
          key={s.key}
          onClick={() => setSoil(s.key)}
          className={`text-left p-2 rounded-xl text-xs transition-all ${
            soil === s.key
              ? 'bg-purple-100 border border-purple-300 text-[#3E2723]'
              : 'bg-white/60 border border-transparent text-[#8D6E63] hover:border-purple-200'
          }`}
        >
          <span className="mr-1">{s.emoji}</span><span className="font-medium">{s.name}</span>
          <span className="text-[#8D6E63] ml-1">{s.desc}</span>
        </button>
      ))}
    </div>
    <div className="flex gap-2">
      <button onClick={onCancel} className="btn btn-secondary flex-1 py-1.5 text-xs">取消</button>
      <button onClick={onFuse} disabled={fusing} className="btn btn-primary flex-1 py-1.5 text-xs">
        {fusing ? '⚗️ 融合中...' : '✨ 开始嫁接'}
      </button>
    </div>
  </div>
);

export default App;
