// ========================
// 核心类型（与 Prisma 子集对齐）
// ========================

export interface User {
  id: string;
  name: string;
  gold: number;
  diamond: number;
  xp: number;
  level: number;
}

export interface Seed {
  id: string;
  name: string;
  description: string;
  emoji: string;
  priceGold: number;
  atomLibrary: string[];
}

export type Stage = 'SEED' | 'SEEDLING' | 'GROWING' | 'MATURE' | 'BLOOMING' | 'RECOVERING';

export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

export interface Flower {
  id: string;
  ownerId: string;
  name: string | null;
  parentAId: string | null;
  parentBId: string | null;
  rarity: Rarity;
  atoms: string[];
  stage: Stage;
  progress: number;
  imageUrl: string | null;
  isShopSeed: boolean;
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
  soil: 'HUMUS' | 'SANDY' | 'CLAY' | 'LOAM';
  ritual?: 'NONE' | 'WHISTLE' | 'SING' | 'PRAY';
}

export interface FusionReward {
  gold: number;
  xp: number;
}

export interface FusionResponse {
  success: boolean;
  flowerId?: string;
  rarity?: Rarity;
  atoms?: string[];
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
