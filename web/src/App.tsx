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
    if (!isLoggedIn || !gameRef.current || gameInstance.current) return;

    const config = createGameConfig('game-container');
    gameInstance.current = new Phaser.Game(config);

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
      <div className="flex items-center justify-center w-full h-full bg-[#1a1a2e]">
        <p className="text-gray-400 animate-pulse">加载中...</p>
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
        <div className="flex items-center justify-between bg-[#1a1a2e] rounded-lg p-3 border border-[#0f3460]">
          <div>
            <span className="text-white font-bold">{user?.name}</span>
            <span className="text-gray-500 text-xs ml-2">Lv.{user?.level}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span>💰 {user?.gold}</span>
            <span>💎 {user?.diamond}</span>
            <span>⭐ {user?.xp}</span>
          </div>
        </div>

        {/* Socket result toast */}
        {resultFlower && (
          <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-center animate-bounce">
            <p className="text-green-300 font-bold">🌺 嫁接完成！</p>
            <p className="text-white">{resultFlower.rarity} 级新花已生成</p>
            {resultFlower.isFirstTime && <p className="text-amber-400 text-sm">首达奖励！</p>}
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-2">
          <button
            onClick={() => setPanelTab('garden')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              panelTab === 'garden' ? 'bg-[#533483] text-white' : 'bg-[#1a1a2e] text-gray-400 border border-[#0f3460]'
            }`}
          >
            🌻 花园
          </button>
          <button
            onClick={() => setPanelTab('shop')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              panelTab === 'shop' ? 'bg-[#533483] text-white' : 'bg-[#1a1a2e] text-gray-400 border border-[#0f3460]'
            }`}
          >
            🛒 商店
          </button>
        </div>

        {/* Fusion Queue Indicator */}
        {fusionQueue.length > 0 && (
          <div className="bg-[#1a1a2e] border border-[#533483] rounded-lg p-2 text-center">
            <span className="text-purple-300 text-sm">
              ⚗️ 已选 {fusionQueue.length}/2
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
