import { Injectable } from '@nestjs/common';
import { AtomLoaderService, RARITY_PROBABILITY_TABLE } from './atom-loader.service';
import { AtomDefinition, AtomLevel, AdjectiveEntry, MergeResult } from './atom.types';

/**
 * 因子积分服务
 *
 * 负责：
 * 1. 计算因子总积分
 * 2. 根据积分查概率表 → 加权随机稀有度
 * 3. 稀有形容词池抽取
 */
@Injectable()
export class AtomScoreService {
  constructor(private readonly atomLoader: AtomLoaderService) {}

  /**
   * 计算一组因子的总积分。
   * 所有因子分数累加（多倍体重复计算）。
   */
  calculateScore(atoms: AtomDefinition[]): number {
    return atoms.reduce((sum, atom) => sum + atom.score, 0);
  }

  /**
   * 根据总积分查概率表，返回稀有度级别。
   */
  rollRarity(totalScore: number): AtomLevel {
    const tiers = this.atomLoader.getScoreTiers();
    const table = this.atomLoader.getProbabilityTable();

    // 找到积分所在挡位
    let tierIndex = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (totalScore >= tiers[i]) {
        tierIndex = i;
        break;
      }
    }

    const row = table[tierIndex];
    const roll = Math.random() * 100;

    // 加权随机：按 UR → SSR → SR → R → N 顺序累加
    let cumulative = 0;
    const check: [AtomLevel, number][] = [
      ['UR', row.UR],
      ['SSR', row.SSR],
      ['SR', row.SR],
      ['R', row.R],
      ['N', row.N],
    ];

    for (const [level, prob] of check) {
      cumulative += prob;
      if (roll < cumulative) return level;
    }

    return 'N'; // fallback
  }

  /**
   * 从稀有形容词池中随机抽取一个。
   * N 稀有度不抽取 → 返回 null。
   */
  rollAdjective(rarity: AtomLevel): AdjectiveEntry | null {
    if (rarity === 'N') return null;

    const pools = this.atomLoader.getAdjectivePools();
    const pool = pools[rarity];
    if (!pool || pool.length === 0) return null;

    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  /**
   * 将形容词转为 AtomDefinition（便于统一处理）。
   */
  adjectiveToAtom(adj: AdjectiveEntry): AtomDefinition {
    return {
      id: adj.id,
      category: 'special', // 形容词归入特殊特征
      prompt_chinese: adj.prompt_chinese,
      prompt_en: adj.prompt_en,
      level: adj.level,
      score: 0,
    };
  }

  /**
   * 构建 MergeResult。
   */
  buildMergeResult(
    atoms: AtomDefinition[],
    inheritedFromA: number,
    inheritedFromB: number,
    appliedRules: string[],
    doubleCount: number,
  ): MergeResult {
    return {
      atoms,
      score: this.calculateScore(atoms),
      inheritedFromA,
      inheritedFromB,
      totalBeforeFusion: atoms.length - appliedRules.length, // approximate
      appliedRules,
      doubleCount,
    };
  }
}
