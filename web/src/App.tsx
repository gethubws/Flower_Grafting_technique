import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './game/phaser/config';
import { useUserStore } from './stores/user.store';
import { useGardenStore } from './stores/garden.store';
import { useFusionStore } from './stores/fusion.store';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { bridge, BridgeEvent } from './game/bridge';
import { gardenApi } from './api/garden.api';

import { RegisterPanel } from './components/user/RegisterPanel';
import { ShopPanel } from './components/shop/ShopPanel';
import { GardenPanel } from './components/garden/GardenPanel';
import { FusionPanel } from './components/fusion/FusionPanel';
import { FusionResultModal } from './components/fusion/FusionResultModal';

const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [panelTab, setPanelTab] = useState<'garden' | 'shop'>('garden');

  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const user = useUserStore((s) => s.user);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);
  const fusionQueue = useFusionStore((s) => s.fusionQueue);
  const resultFlower = useFusionStore((s) => s.resultFlower);
  const setResult = useFusionStore((s) => s.setResult);

  const { loading } = useAuth();
  useSocket(user?.id || null);

  // Init Phaser
  useEffect(() => {
    if (!isLoggedIn || gameInstance.current) return;

    // 确保 DOM 容器存在
    const container = document.getElementById('game-container');
    if (!container) {
      console.error('game-container not found');
      return;
    }

    console.log('Creating Phaser game, container:', container.offsetWidth, 'x', container.offsetHeight);
    const config = createGameConfig('game-container');
    const game = new Phaser.Game(config);
    gameInstance.current = game;
    console.log('Phaser game created, canvas:', game.canvas?.width, 'x', game.canvas?.height);

    // After scene starts, load garden data
    setTimeout(async () => {
      const [garden, inv] = await Promise.all([gardenApi.getGarden(), gardenApi.getSeedInventory()]);
      setSlots(garden);
      setSeedInventory(inv);
      bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
    }, 800);

    return () => {
      gameInstance.current?.destroy(true);
      gameInstance.current = null;
    };
  }, [isLoggedIn]);

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

  return (
    <div className="flex w-full h-full">
      {/* Phaser Canvas */}
      <div id="game-container" ref={gameRef} className="flex-1" />

      {/* React UI Panel */}
      <div id="ui-panel" className="w-[360px] flex flex-col gap-4">
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
              panelTab === 'garden'
                ? 'active bg-[#1a1a2e] text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🌻 花园
          </button>
          <button
            onClick={() => setPanelTab('shop')}
            className={`tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              panelTab === 'shop'
                ? 'active bg-[#1a1a2e] text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🛒 商店
          </button>
        </div>

        {/* Fusion Queue Indicator */}
        {fusionQueue.length > 0 && (
          <div className="card p-2 text-center animate-pulse-glow border-purple-600/30">
            <span className="text-purple-300 text-sm font-medium">
              ⚗️ 嫁接队列 {fusionQueue.length}/2
            </span>
          </div>
        )}

        {/* Panels */}
        {panelTab === 'garden' ? <GardenPanel /> : <ShopPanel />}

        {/* Fusion Panel (always visible when queue has items) */}
        <FusionPanel />

        {/* Fusion Result Modal */}
        <FusionResultModal />
      </div>
    </div>
  );
};

export default App;
