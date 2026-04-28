import type { GardenSlot, Flower, FusionCompletePayload } from '../../types';

type Listener = (...args: any[]) => void;

class Bridge {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }
}

export const bridge = new Bridge();

export const BridgeEvent = {
  // Phaser → React
  SLOT_CLICKED: 'slotClicked',
  POT_CLICKED: 'potClicked',
  POT_DETAIL_TOGGLE: 'potDetailToggle', // flower detail popup
  POT_POSITION: 'potPosition',          // position update for popup placement

  // React → Phaser
  REFRESH_GARDEN: 'refreshGarden',
  FUSION_RESULT: 'fusionResult',
  TOOL_ACTIVATED: 'toolActivated'
} as const;

export interface SlotClickedPayload {
  position: number;
  flower: Flower | null;
}

export interface PotClickedPayload {
  position: number;
  flowerId: string | null;
  flower: Flower | null;
}

export interface ToolActivatedPayload {
  tool: 'seed' | 'glove' | 'knife' | null;
}

export interface PotDetailTogglePayload {
  position: number;
  flower: Flower | null;
  screenX: number;
  screenY: number;
}

export interface PotPositionPayload {
  position: number;
  flower: Flower | null;
  screenX: number;
  screenY: number;
}
