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
import type { PotClickedPayload } from './game/bridge';
import type { GroupedSeedItem } from './types';

import { RegisterPanel } from './components/user/RegisterPanel';
import { Toolbar } from './components/common/Toolbar';
import { Button } from './components/common/Button';

import { ShopPanel } from './components/shop/ShopPanel';
import { GardenPanel } from './components/garden/GardenPanel';
import { FusionPanel } from './components/fusion/FusionPanel';
import { FusionResultModal } from './components/fusion/FusionResultModal';

const App: React.FC = () => {
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [panelTab, setPanelTab] = useState<'garden' | 'shop'>('garden');

  // Toolbar state
  const [activeTool, setActiveTool] = useState<'seed' | 'glove' | null>(null);
  const [pickedSeed, setPickedSeed] = useState<GroupedSeedItem | null>(null);

  // Shop overlay
  const [showShop, setShowShop] = useState(false);
  const [showGardenPanel, setShowGardenPanel] = useState(true);

  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const user = useUserStore((s) => s.user);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);
  const seeds = useGardenStore((s) => s.seedInventory);
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const resultFlower = useFusionStore((s) => s.resultFlower);
  const setResult = useFusionStore((s) => s.setResult);

  const { loading } = useAuth();
  useSocket(user?.id || null);

  const refreshGarden = useCallback(async () => {
    const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
    setSlots(garden);
    setSeedInventory(inv);
    bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    return { garden, inv };
  }, [setSlots, setSeedInventory]);

  // Init Phaser — full screen
  useEffect(() => {
    if (!isLoggedIn || loading || gameInstance.current) return;
    const container = document.getElementById('game-container');
    if (!container) return;

    const config = createGameConfig('game-container');
    gameInstance.current = new Phaser.Game(config);

    setTimeout(async () => { await refreshGarden(); }, 800);

    return () => {
      gameInstance.current?.destroy(true);
      gameInstance.current = null;
    };
  }, [isLoggedIn, loading]);

  // Sync active tool to Phaser
  useEffect(() => {
    bridge.emit(BridgeEvent.TOOL_ACTIVATED, { tool: activeTool });
  }, [activeTool]);

  // Handle pot clicks
  useEffect(() => {
    const handler = async (payload: PotClickedPayload) => {
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
      } else if (activeTool === 'glove') {
        if (!payload.flower) return;
        if (payload.flower.stage !== 'BLOOMING') return alert('只有盛放期的花才能收获');
        try {
          const result = await gardenApi.harvest(payload.flowerId!);
          alert(`🎉 收获成功！\n${result.flowerName}\n💰 +${result.reward.gold}g  ⭐ +${result.reward.xp}xp`);
          await refreshGarden();
        } catch (e: any) {
          alert(e.response?.data?.message || '收获失败');
        }
      }
    };
    bridge.on(BridgeEvent.POT_CLICKED, handler);
    return () => { bridge.off(BridgeEvent.POT_CLICKED, handler); };
  }, [activeTool, pickedSeed, seeds]);

  // Fusion result auto-dismiss
  useEffect(() => {
    if (!resultFlower) return;
    const timer = setTimeout(() => setResult(null), 6000);
    return () => clearTimeout(timer);
  }, [resultFlower]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#0a0a1a] gap-4">
        <div className="text-4xl animate-bounce-soft">🌺</div>
        <p className="text-gray-500 text-sm animate-pulse">加载中...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="w-full h-full bg-[#1a1a2e]">
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
        <div className="bg-[#0a0a1a]/80 backdrop-blur-md rounded-xl border border-white/5 px-3 py-2 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            {(user?.name || '?')[0]}
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">{user?.name}</div>
            <div className="text-gray-500 text-xxs">Lv.{user?.level}</div>
          </div>
          <div className="flex gap-2 text-xxs ml-1">
            <span className="text-amber-400 bg-amber-900/20 px-1.5 py-0.5 rounded">💰 {user?.gold}</span>
            <span className="text-cyan-400 bg-cyan-900/20 px-1.5 py-0.5 rounded">💎 {user?.diamond}</span>
            <span className="text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded">⭐ {user?.xp}</span>
          </div>
        </div>
      </div>

      {/* ==================== Top-Right: Shop Toggle + Garden Toggle ==================== */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button
          onClick={() => { setShowGardenPanel(!showGardenPanel); setShowShop(false); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all ${
            showGardenPanel
              ? 'bg-green-900/40 border border-green-600/30 text-green-300'
              : 'bg-[#0a0a1a]/60 border border-white/5 text-gray-400 hover:text-white'
          }`}
        >
          🌻 花园
        </button>
        <button
          onClick={() => { setShowShop(!showShop); setShowGardenPanel(false); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all ${
            showShop
              ? 'bg-amber-900/40 border border-amber-600/30 text-amber-300'
              : 'bg-[#0a0a1a]/60 border border-white/5 text-gray-400 hover:text-white'
          }`}
        >
          🛒 商店
        </button>
      </div>

      {/* ==================== Overlay: Garden Panel ==================== */}
      {showGardenPanel && (
        <div className="absolute top-16 right-3 z-20 w-72 max-h-[55vh] overflow-y-auto
                        bg-[#0a0a1a]/85 backdrop-blur-lg rounded-xl border border-white/5 p-3
                        animate-fade-in shadow-2xl">
          <GardenPanel />
        </div>
      )}

      {/* ==================== Overlay: Shop Panel ==================== */}
      {showShop && (
        <div className="absolute top-16 right-3 z-20 w-72 max-h-[55vh] overflow-y-auto
                        bg-[#0a0a1a]/85 backdrop-blur-lg rounded-xl border border-white/5 p-3
                        animate-fade-in shadow-2xl">
          <ShopPanel />
        </div>
      )}

      {/* ==================== Fusion Panel (floating) ==================== */}
      {fusionQueue.length > 0 && (
        <div className="absolute top-16 right-3 z-20 w-72
                        bg-[#0a0a1a]/85 backdrop-blur-lg rounded-xl border border-purple-500/20 p-3
                        animate-fade-in animate-pulse-glow shadow-2xl">
          <FusionPanel />
        </div>
      )}

      {/* ==================== Popup: Fusion Result ==================== */}
      <FusionResultModal />

      {/* ==================== Toast: Socket Fusion Result ==================== */}
      {resultFlower && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30
                        bg-gradient-to-r from-green-900/90 to-emerald-900/90 backdrop-blur-md
                        border border-green-500/30 rounded-xl p-4 text-center animate-fade-in shadow-2xl">
          <p className="text-green-300 font-bold text-sm">🌺 嫁接完成！</p>
          <p className="text-white text-xs mt-1">{resultFlower.rarity} 级新花已种入花园</p>
          {resultFlower.isFirstTime && <p className="text-amber-400 text-xs mt-1">🎉 首达奖励！</p>}
        </div>
      )}

      {/* ==================== Bottom: Toolbar ==================== */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Seed picker overlay */}
        {activeTool === 'seed' && (
          <div className="bg-[#0a0a1a]/90 backdrop-blur-md border-t border-amber-800/20 p-2 animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-amber-400 text-xs font-medium">选择种子：</span>
              {seeds.length === 0 ? (
                <span className="text-gray-500 text-xs">没有种子，去商店购买</span>
              ) : (
                seeds.map((seed) => (
                  <button
                    key={seed.name}
                    onClick={() => setPickedSeed(pickedSeed?.name === seed.name ? null : seed)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      pickedSeed?.name === seed.name
                        ? 'bg-amber-900/50 border border-amber-500 text-amber-300'
                        : 'bg-[#1a1a2e] border border-[#1a1a3e] text-gray-400 hover:border-amber-800/50'
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
              <p className="text-amber-400 text-xs text-center mt-1.5 animate-fade-in">
                👆 已选中「{pickedSeed.name}」，点击花园中的花盆即可种植
              </p>
            )}
          </div>
        )}

        {/* Glove hint */}
        {activeTool === 'glove' && (
          <div className="bg-[#0a0a1a]/90 backdrop-blur-md border-t border-green-800/20 p-2 animate-fade-in text-center">
            <p className="text-green-400 text-xs">👆 点击花园中盛放期（🌸）的花朵即可收获</p>
          </div>
        )}

        <Toolbar
          activeTool={activeTool}
          setActiveTool={(t) => { setActiveTool(t); if (t !== 'seed') setPickedSeed(null); }}
          seedCount={totalSeeds}
        />
      </div>
    </div>
  );
};

export default App;
