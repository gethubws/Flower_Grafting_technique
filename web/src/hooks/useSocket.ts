import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useFusionStore } from '../stores/fusion.store';
import { useGardenStore } from '../stores/garden.store';
import { bridge, BridgeEvent } from '../game/bridge';
import { gardenApi } from '../api/garden.api';
import type { FusionCompletePayload } from '../types';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const useSocket = (userId: string | null) => {
  const setResult = useFusionStore((s) => s.setResult);
  const setSlots = useGardenStore((s) => s.setSlots);
  const setSeedInventory = useGardenStore((s) => s.setSeedInventory);

  useEffect(() => {
    if (!userId) return;

    socket = io('/fusion', {
      query: { userId },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('fusion:complete', async (payload: FusionCompletePayload) => {
      setResult(payload);
      // Refresh garden to show the new fusion flower with its image
      try {
        const [garden, inv] = await Promise.all([
          gardenApi.getGarden(),
          gardenApi.getSeedInventory(),
        ]);
        setSlots(garden);
        setSeedInventory(inv);
        bridge.emit(BridgeEvent.REFRESH_GARDEN, garden);
      } catch (e) {
        console.error('Failed to refresh garden after fusion:', e);
      }
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [userId]);
};
