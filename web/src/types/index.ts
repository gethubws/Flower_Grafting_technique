// ========================
// Phase 1.5 全量类型
// ========================

export interface User {
  id: string;
  name: string;
  gold: number;
  diamond: number;
  xp: number;
  level: number;
  title?: string | null;
}

export interface Seed {
  id: string;
  name: string;
  description: string;
  emoji: string;
  priceGold: number;
  atomLibrary: any[];
}

export type Stage = 'SEED' | 'SEEDLING' | 'GROWING' | 'MATURE' | 'BLOOMING' | 'RECOVERING';
export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export type SoilType = 'HUMUS' | 'SANDY' | 'CLAY' | 'LOAM';
export type ShopSort = 'newest' | 'sales' | 'rarity';

export interface AtomEntry {
  id: string;
  category: string;
  level: string;
  prompt_chinese: string;
}

export interface Flower {
  id: string;
  ownerId: string;
  name: string | null;
  parentAId: string | null;
  parentBId: string | null;
  rarity: Rarity;
  atoms: any[];
  stage: Stage;
  progress: number;
  imageUrl: string | null;
  isShopSeed: boolean;
  factorScore?: number;
  sellPrice?: number | null;
  location?: string;
  isFoundation?: boolean;
  stabilityProgress?: number;
}

export interface GardenSlot {
  id: string | null;
  userId: string;
  position: number;
  flowerId: string | null;
  flower: Flower | null;
}

export interface FusionRequest {
  parentAId: string;
  parentBId: string;
  soil: SoilType;
  ritual?: 'NONE' | 'WHISTLE' | 'SING' | 'PRAY';
  stabilityTargetId?: string;
}

export interface FusionReward {
  gold: number;
  xp: number;
}

export interface StabilityResult {
  similar: boolean;
  reason?: string;
  diff?: number;
  progress?: number;
  becameFoundation?: boolean;
}

export interface FusionResponse {
  success: boolean;
  flowerId?: string;
  rarity?: Rarity;
  atoms?: any[];
  factorScore?: number;
  inheritedCount?: number;
  droppedCount?: number;
  appliedRules?: string[];
  doubleCount?: number;
  stabilityResult?: StabilityResult | null;
  reward?: FusionReward;
  isFirstTime?: boolean;
  failType?: 'NORMAL' | 'GRAVE';
  imageUrl?: string;
}

export interface FusionCompletePayload {
  flowerId: string;
  rarity: Rarity;
  atoms: string[];
  imageUrl: string | null;
  reward: FusionReward;
  isFirstTime: boolean;
}

export interface RegisterResponse {
  accessToken: string;
  user: User;
}

export interface GroupedSeedItem {
  name: string;
  rarity: Rarity;
  count: number;
  sampleId: string;
}

// Phase 1.5: Warehouse
export interface WarehouseFlower {
  id: string;
  name: string | null;
  rarity: Rarity;
  isShopSeed: boolean;
  sellPrice: number | null;
  factorScore: number;
  imageUrl: string | null;
  atoms: any[];
  atomCount: number;
  createdAt: string;
}

// Phase 1.5: Shop dual-tab
export interface ShopData {
  system: Seed[];
  player: PlayerSeedItem[];
}

export interface PlayerSeedItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  priceGold: number;
  sellerId: string;
  totalSold: number;
  revenueShare: number;
  atomCount: number;
  createdAt: string;
}

// Phase 1.5: Foundation
export interface FoundationStatus {
  id: string;
  name: string | null;
  rarity: Rarity;
  isFoundation: boolean;
  stabilityProgress: number;
  factorScore: number;
  imageUrl: string | null;
  atomCount: number;
  remaining: number;
  isComplete: boolean;
}
