// ========================
// Phase 1.5 枚举
// ========================
// Factor-related data moved to AtomLoaderService (RARITY_PROBABILITY_TABLE, LEVEL_SCORE).
// This file keeps only core enums used across modules.

export enum Rarity {
  N = 'N',
  R = 'R',
  SR = 'SR',
  SSR = 'SSR',
  UR = 'UR',
}

export enum Stage {
  SEED = 'SEED',
  SEEDLING = 'SEEDLING',
  GROWING = 'GROWING',
  MATURE = 'MATURE',
  BLOOMING = 'BLOOMING',
  RECOVERING = 'RECOVERING',
}

export function getStageFromProgress(progress: number): Stage {
  if (progress <= 0) return Stage.SEED;
  if (progress < 30) return Stage.SEEDLING;
  if (progress < 70) return Stage.GROWING;
  if (progress < 100) return Stage.MATURE;
  return Stage.BLOOMING;
}

export enum FlowerLocation {
  GARDEN = 'GARDEN',
  WAREHOUSE = 'WAREHOUSE',
}

export enum SoilType {
  HUMUS = 'HUMUS',
  SANDY = 'SANDY',
  CLAY = 'CLAY',
  LOAM = 'LOAM',
}

export const SOIL_MODIFIERS: Record<
  SoilType,
  { successBonus: number; valueBonus: number; name: string }
> = {
  [SoilType.HUMUS]: { successBonus: 0, valueBonus: 15, name: '腐殖土' },
  [SoilType.SANDY]: { successBonus: 5, valueBonus: -5, name: '沙土' },
  [SoilType.CLAY]: { successBonus: 10, valueBonus: 0, name: '粘土' },
  [SoilType.LOAM]: { successBonus: 0, valueBonus: 0, name: '壤土' },
};

export enum FailType {
  NORMAL = 'NORMAL',
  GRAVE = 'GRAVE',
}

export enum TransactionType {
  BUY = 'BUY',
  FUSION_REWARD = 'FUSION_REWARD',
  HARVEST_SELL = 'HARVEST_SELL',
  REVENUE_SHARE = 'REVENUE_SHARE',
  SYSTEM = 'SYSTEM',
  REFUND = 'REFUND',
}

export enum RitualType {
  NONE = 'NONE',
  WHISTLE = 'WHISTLE',
  SING = 'SING',
  PRAY = 'PRAY',
}

// ========================
// 收获 XP 奖励（Phase 1.5: 仓库制，收获只给 XP 不给金币）
// ========================

export const HARVEST_XP_REWARDS: Record<Rarity, number> = {
  [Rarity.N]: 15,
  [Rarity.R]: 30,
  [Rarity.SR]: 60,
  [Rarity.SSR]: 150,
  [Rarity.UR]: 300,
};

// ========================
// 仓库出售稀有度乘区
// ========================

export const RARITY_SELL_MULTIPLIER: Record<Rarity, number> = {
  [Rarity.N]: 1.0,
  [Rarity.R]: 1.5,
  [Rarity.SR]: 2.5,
  [Rarity.SSR]: 5.0,
  [Rarity.UR]: 10.0,
};

// ========================
// Fusion 首次奖励（Phase 1 残留，Phase 1.5 融合成功仍给此奖励）
// ========================

export const FUSION_REWARDS: Record<
  Rarity,
  { gold: number; xp: number; firstTimeBonus: { gold: number; xp: number } }
> = {
  [Rarity.N]: { gold: 50, xp: 10, firstTimeBonus: { gold: 100, xp: 20 } },
  [Rarity.R]: { gold: 100, xp: 30, firstTimeBonus: { gold: 200, xp: 60 } },
  [Rarity.SR]: { gold: 200, xp: 60, firstTimeBonus: { gold: 400, xp: 120 } },
  [Rarity.SSR]: { gold: 500, xp: 150, firstTimeBonus: { gold: 1000, xp: 300 } },
  [Rarity.UR]: { gold: 1000, xp: 300, firstTimeBonus: { gold: 2000, xp: 600 } },
};
