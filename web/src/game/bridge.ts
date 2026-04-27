import type { GardenSlot, Flower, FusionCompletePayload } from '../../types';

/**
 * Phaser ↔ React 桥接事件总线
 */
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

// ========================
// Event Names
// ========================
export const BridgeEvent = {
  // Phaser → React
  SLOT_CLICKED: 'slotClicked',
  FLOWER_DRAGGED: 'flowerDragged',

  // React → Phaser
  REFRESH_GARDEN: 'refreshGarden',
  FUSION_RESULT: 'fusionResult',
} as const;

// ========================
// Event Payload Types
// ========================
export interface SlotClickedPayload {
  position: number;
  flower: Flower | null;
}

export interface FlowerDraggedPayload {
  flowerId: string;
  position: number;
}
