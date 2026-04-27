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
import { ShopPanel } from './components/shop/ShopPanel';
import { GardenPanel } from './components/garden/GardenPanel';
import { FusionPanel } from './components/fusion/FusionPanel';
import { FusionResultModal } from './components/fusion/FusionResultModal';
import { Toolbar } from './components/common/Toolbar';
import { Button } from './components/common/Button';

const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [panelTab, setPanelTab] = useState<'garden' | 'shop'>('garden');

  // Toolbar state
  const [activeTool, setActiveTool] = useState<'seed' | 'glove' | null>(null);
  const [pickedSeed, setPickedSeed] = useState<GroupedSeedItem | null>(null);

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

  // Init Phaser
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

  // Handle pot clicks based on active tool
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

  // Handle Socket fusion result
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
    <div className="flex flex-col w-full h-full">
      {/* Main area: Phaser + Panel */}
      <div className="flex flex-1 min-h-0">
        {/* Phaser Canvas + Toolbar */}
        <div className="flex flex-col flex-1 min-w-0">
          <div id="game-container" ref={gameRef} className="flex-1 relative" />

          {/* Seed picker overlay */}
          {activeTool === 'seed' && (
            <div className="bg-[#0d1117] border-t border-amber-800/30 p-2 animate-fade-in">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-amber-400 text-xs font-medium whitespace-nowrap">选择种子：</span>
                {seeds.length === 0 ? (
                  <span className="text-gray-600 text-xs">没有种子，去商店购买</span>
                ) : (
                  seeds.map((seed) => (
                    <button
                      key={seed.name}
                      onClick={() => setPickedSeed(pickedSeed?.name === seed.name ? null : seed)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                        pickedSeed?.name === seed.name
                          ? 'bg-amber-900/40 border border-amber-500 text-amber-300'
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
                <p className="text-amber-500 text-xs mt-1.5 animate-fade-in">
                  👆 已选中「{pickedSeed.name}」，点击花园中的花盆即可种植
                </p>
              )}
            </div>
          )}

          {/* Glove hint */}
          {activeTool === 'glove' && (
            <div className="bg-[#0d1117] border-t border-green-800/30 p-2 animate-fade-in">
              <p className="text-green-400 text-xs">👆 点击花园中盛放期（🌸）的花朵即可收获</p>
            </div>
          )}

          {/* Toolbar */}
          <Toolbar
            activeTool={activeTool}
            setActiveTool={(t) => { setActiveTool(t); if (t !== 'seed') setPickedSeed(null); }}
            seedCount={totalSeeds}
          />
        </div>

        {/* React UI Panel */}
        <div id="ui-panel" className="w-[380px] min-w-[380px] flex flex-col gap-4">
          {/* User Bar */}
          <div className="card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                {(user?.name || '?')[0]}
              </div>
              <div>
                <div className="text-white font-bold text-sm">{user?.name}</div>
                <div className="text-gray-500 text-xs">Lv.{user?.level}</div>
              </div>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-amber-400">💰 {user?.gold}</span>
              <span className="text-cyan-400">💎 {user?.diamond}</span>
              <span className="text-purple-400">⭐ {user?.xp}</span>
            </div>
          </div>

          {/* Socket result toast */}
          {resultFlower && (
            <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-700/50 rounded-lg p-3 text-center animate-fade-in">
              <p className="text-green-300 font-bold text-sm">🌺 嫁接完成！</p>
              <p className="text-white text-xs">{resultFlower.rarity} 级新花已种入花园</p>
              {resultFlower.isFirstTime && <p className="text-amber-400 text-xs mt-1">🎉 首达奖励！</p>}
            </div>
          )}

          {/* Tab Bar */}
          <div className="flex bg-[#0d1117] rounded-lg p-1 gap-1">
            <button
              onClick={() => setPanelTab('garden')}
              className={`tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                panelTab === 'garden' ? 'active bg-[#1a1a2e] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              🌻 花园
            </button>
            <button
              onClick={() => setPanelTab('shop')}
              className={`tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                panelTab === 'shop' ? 'active bg-[#1a1a2e] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              🛒 商店
            </button>
          </div>

          {/* Fusion Queue Indicator */}
          {fusionQueue.length > 0 && (
            <div className="card p-2 text-center animate-pulse-glow border-purple-600/30">
              <span className="text-purple-300 text-sm font-medium">⚗️ 嫁接队列 {fusionQueue.length}/2</span>
            </div>
          )}

          {/* Panels */}
          {panelTab === 'garden' ? <GardenPanel /> : <ShopPanel />}

          {/* Fusion Panel */}
          <FusionPanel />

          {/* Fusion Result Modal */}
          <FusionResultModal />
        </div>
      </div>
    </div>
  );
};

export default App;
