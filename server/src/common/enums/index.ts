// ========================
// Phase 1 全量枚举
// ========================

export enum Rarity {
  N = 'N',       // 普通 — 灰色
  R = 'R',       // 稀有 — 蓝色
  SR = 'SR',     // 超稀有 — 紫色
  SSR = 'SSR',   // 极稀有 — 金色
  UR = 'UR',     // 传说 — 红色
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  [Rarity.N]: 5000,   // 50%
  [Rarity.R]: 3000,   // 30%
  [Rarity.SR]: 1500,  // 15%
  [Rarity.SSR]: 400,  // 4%
  [Rarity.UR]: 100,   // 1%
};

export const RARITY_COLORS: Record<Rarity, number> = {
  [Rarity.N]: 0x808080,
  [Rarity.R]: 0x4488ff,
  [Rarity.SR]: 0xaa44ff,
  [Rarity.SSR]: 0xffaa00,
  [Rarity.UR]: 0xff3333,
};

export enum Stage {
  SEED = 'SEED',
  SEEDLING = 'SEEDLING',
  GROWING = 'GROWING',
  MATURE = 'MATURE',
  BLOOMING = 'BLOOMING',
  RECOVERING = 'RECOVERING',
}

export const STAGE_THRESHOLDS: { stage: Stage; min: number; max: number }[] = [
  { stage: Stage.SEED, min: 0, max: 0 },
  { stage: Stage.SEEDLING, min: 1, max: 29 },
  { stage: Stage.GROWING, min: 30, max: 69 },
  { stage: Stage.MATURE, min: 70, max: 99 },
  { stage: Stage.BLOOMING, min: 100, max: 100 },
];

/**
 * 根据 progress 值返回当前阶段
 */
export function getStageFromProgress(progress: number): Stage {
  if (progress <= 0) return Stage.SEED;
  if (progress < 30) return Stage.SEEDLING;
  if (progress < 70) return Stage.GROWING;
  if (progress < 100) return Stage.MATURE;
  return Stage.BLOOMING;
}

export enum SoilType {
  HUMUS = 'HUMUS',     // 腐殖土 — 无成功率加成，价值+15%
  SANDY = 'SANDY',     // 沙土 — 成功率+5%，价值-5%
  CLAY = 'CLAY',       // 粘土 — 成功率+10%，生长时间+50%
  LOAM = 'LOAM',       // 壤土 — 无加成无减成
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
  NORMAL = 'NORMAL',   // 普通失败：亲本保留
  GRAVE = 'GRAVE',     // 大失败：亲本A → RECOVERING
}

export enum TransactionType {
  BUY = 'BUY',
  FUSION_REWARD = 'FUSION_REWARD',
  SYSTEM = 'SYSTEM',
  REFUND = 'REFUND',
}

export enum CurrencyType {
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
}

export enum RitualType {
  NONE = 'NONE',
  WHISTLE = 'WHISTLE',
  SING = 'SING',
  PRAY = 'PRAY',
}

// ========================
// Fusion 奖励配置
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
