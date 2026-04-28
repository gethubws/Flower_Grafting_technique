import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  AtomDefinition,
  AtomLevel,
  CategoryDefinition,
  FusionRule,
  AdjectiveEntry,
  AdjectivePools,
  RarityProbabilityRow,
} from './atom.types';

// ============================================
// 稀有度概率表（9 挡位，线性单调）
// 每行合计 100.00%
// ============================================
export const RARITY_PROBABILITY_TABLE: RarityProbabilityRow[] = [
  { N: 50.00, R: 35.00, SR: 12.00, SSR: 2.90, UR: 0.10 },  // 0-8
  { N: 46.25, R: 36.25, SR: 13.75, SSR: 3.54, UR: 0.21 },  // 9-15
  { N: 42.50, R: 37.50, SR: 15.50, SSR: 4.18, UR: 0.33 },  // 16-24
  { N: 38.75, R: 38.75, SR: 17.25, SSR: 4.81, UR: 0.44 },  // 25-35
  { N: 35.00, R: 40.00, SR: 19.00, SSR: 5.45, UR: 0.55 },  // 36-48
  { N: 31.25, R: 41.25, SR: 20.75, SSR: 6.09, UR: 0.66 },  // 49-63
  { N: 27.50, R: 42.50, SR: 22.50, SSR: 6.73, UR: 0.78 },  // 64-80
  { N: 23.75, R: 43.75, SR: 24.25, SSR: 7.36, UR: 0.89 },  // 81-99
  { N: 20.00, R: 45.00, SR: 26.00, SSR: 8.00, UR: 1.00 },  // 100+
];

/** 积分挡位阈值 */
const SCORE_TIERS = [0, 9, 16, 25, 36, 49, 64, 81, 100];

/** Level → Score 映射 */
const LEVEL_SCORE: Record<AtomLevel, number> = {
  N: 1,
  R: 5,
  SR: 10,
  SSR: 20,
  UR: 50,
};

const ATOMS_DIR = path.resolve(process.cwd(), 'config/atoms');
const LEVEL_FILES: Record<AtomLevel, string> = {
  N: 'standard.yaml',
  R: 'rare.yaml',
  SR: 'precious.yaml',
  SSR: 'epic.yaml',
  UR: 'legendary.yaml',
};

@Injectable()
export class AtomLoaderService implements OnModuleInit {
  private readonly logger = new Logger(AtomLoaderService.name);

  // 内存索引
  private atomsById = new Map<string, AtomDefinition>();
  private atomsByCategory = new Map<string, AtomDefinition[]>();
  private atomsByLevel = new Map<AtomLevel, AtomDefinition[]>();
  private atomsAll: AtomDefinition[] = [];
  private categories = new Map<string, CategoryDefinition>();
  private fusionRules: FusionRule[] = [];
  private adjectivePools: AdjectivePools = { N: [], R: [], SR: [], SSR: [], UR: [] };

  onModuleInit() {
    this.loadAll();
  }

  // ========== 公开查询方法 ==========

  getAtom(id: string): AtomDefinition | undefined {
    return this.atomsById.get(id);
  }

  getAtomsByIds(ids: string[]): AtomDefinition[] {
    return ids.map((id) => this.atomsById.get(id)).filter(Boolean) as AtomDefinition[];
  }

  getAtomsByCategory(category: string): AtomDefinition[] {
    return this.atomsByCategory.get(category) || [];
  }

  getAtomsByLevel(level: AtomLevel): AtomDefinition[] {
    return this.atomsByLevel.get(level) || [];
  }

  getAllAtoms(): AtomDefinition[] {
    return this.atomsAll;
  }

  getCategories(): Map<string, CategoryDefinition> {
    return this.categories;
  }

  getFusionRules(): FusionRule[] {
    return this.fusionRules;
  }

  getAdjectivePools(): AdjectivePools {
    return this.adjectivePools;
  }

  getProbabilityTable(): RarityProbabilityRow[] {
    return RARITY_PROBABILITY_TABLE;
  }

  getScoreTiers(): number[] {
    return SCORE_TIERS;
  }

  getLevelScore(level: AtomLevel): number {
    return LEVEL_SCORE[level];
  }

  // ========== 加载逻辑 ==========

  private loadAll() {
    this.logger.log('Loading atom system...');

    try {
      this.loadCategories();
      this.loadAtomFiles();
      this.loadFusionRules();
      this.loadAdjectivePools();
      this.logger.log(
        `Atom system loaded: ${this.atomsAll.length} atoms, ` +
        `${this.fusionRules.length} fusion rules, ` +
        `${this.categories.size} categories`,
      );
    } catch (err: any) {
      this.logger.error(`Failed to load atom system: ${err.message}`);
      throw err;
    }
  }

  private loadCategories() {
    const raw = this.readYaml('categories.yaml');
    const cats = raw?.categories as Record<string, any> | undefined;
    if (!cats) throw new Error('categories.yaml missing or empty');

    for (const [key, val] of Object.entries(cats)) {
      this.categories.set(key, {
        label: val.label || key,
        weight: val.weight ?? 1.0,
      });
    }
    this.logger.log(`  Loaded ${this.categories.size} categories`);
  }

  private loadAtomFiles() {
    let total = 0;
    let skipped = 0;

    for (const [level, filename] of Object.entries(LEVEL_FILES) as [AtomLevel, string][]) {
      const raw = this.readYaml(filename);
      const atoms: any[] = raw?.atoms || [];
      if (!Array.isArray(atoms)) {
        this.logger.warn(`  ${filename}: no atoms array found`);
        continue;
      }

      for (const entry of atoms) {
        const errors = this.validateAtom(entry, level);
        if (errors.length > 0) {
          this.logger.warn(`  ⚠ Skipping atom "${entry.id || '?'}" in ${filename}: ${errors.join(', ')}`);
          skipped++;
          continue;
        }

        const atom: AtomDefinition = {
          id: entry.id,
          category: entry.category,
          prompt_chinese: entry.prompt_chinese,
          prompt_en: entry.prompt_en,
          level,
          score: entry.score ?? LEVEL_SCORE[level],
          incompatible: entry.incompatible || [],
          description: entry.description,
        };

        if (this.atomsById.has(atom.id)) {
          this.logger.warn(`  ⚠ Duplicate atom id "${atom.id}" in ${filename}, skipping`);
          skipped++;
          continue;
        }

        this.atomsById.set(atom.id, atom);

        if (!this.atomsByCategory.has(atom.category)) {
          this.atomsByCategory.set(atom.category, []);
        }
        this.atomsByCategory.get(atom.category)!.push(atom);

        if (!this.atomsByLevel.has(level)) {
          this.atomsByLevel.set(level, []);
        }
        this.atomsByLevel.get(level)!.push(atom);

        this.atomsAll.push(atom);
        total++;
      }
    }

    this.logger.log(`  Loaded ${total} atoms (${skipped} skipped)`);
  }

  private validateAtom(entry: any, expectedLevel: AtomLevel): string[] {
    const errors: string[] = [];

    if (!entry.id || typeof entry.id !== 'string') errors.push('missing id');
    if (!entry.category || typeof entry.category !== 'string') errors.push('missing category');
    if (entry.category && !this.categories.has(entry.category)) {
      errors.push(`unknown category "${entry.category}"`);
    }
    if (!entry.prompt_chinese) errors.push('missing prompt_chinese');
    if (!entry.prompt_en) errors.push('missing prompt_en');

    const actualLevel = entry.level;
    if (actualLevel && actualLevel !== expectedLevel) {
      errors.push(`level mismatch: expected ${expectedLevel}, got ${actualLevel}`);
    }

    const score = entry.score;
    const expectedScore = LEVEL_SCORE[expectedLevel];
    if (score !== undefined && score !== expectedScore) {
      errors.push(`score mismatch: expected ${expectedScore}, got ${score}`);
    }

    if (entry.incompatible && !Array.isArray(entry.incompatible)) {
      errors.push('incompatible must be an array');
    }

    return errors;
  }

  private loadFusionRules() {
    const raw = this.readYaml('fusion_rules.yaml');
    const rules: any[] = raw?.rules || [];
    if (!Array.isArray(rules)) {
      this.logger.warn('  fusion_rules.yaml: no rules array found');
      return;
    }

    let skipped = 0;
    for (const entry of rules) {
      const errors = this.validateFusionRule(entry);
      if (errors.length > 0) {
        this.logger.warn(`  ⚠ Skipping fusion rule "${entry.name || '?'}": ${errors.join(', ')}`);
        skipped++;
        continue;
      }

      this.fusionRules.push({
        name: entry.name,
        description: entry.description,
        priority: entry.priority ?? 0,
        condition: entry.condition,
        result: entry.result,
      });
    }

    // 按 priority 降序排序
    this.fusionRules.sort((a, b) => b.priority - a.priority);
    this.logger.log(`  Loaded ${this.fusionRules.length} fusion rules (${skipped} skipped)`);
  }

  private validateFusionRule(entry: any): string[] {
    const errors: string[] = [];
    if (!entry.name) errors.push('missing name');
    if (!entry.condition?.type) errors.push('missing condition.type');
    if (!entry.result?.produce_atom) errors.push('missing result.produce_atom');

    // 验证 produce_atom 存在
    const produceId = entry.result?.produce_atom;
    if (produceId && !this.atomsById.has(produceId)) {
      errors.push(`produce_atom "${produceId}" not found in atom definitions`);
    }

    // 验证 replace_atoms 存在
    const replaceIds: string[] = entry.result?.replace_atoms || [];
    for (const rid of replaceIds) {
      if (!this.atomsById.has(rid)) {
        errors.push(`replace_atom "${rid}" not found in atom definitions`);
      }
    }

    return errors;
  }

  private loadAdjectivePools() {
    const raw = this.readYaml('adjective_pools.yaml');
    const pools = raw?.pools as Record<string, any[]> | undefined;
    if (!pools) {
      this.logger.warn('  adjective_pools.yaml: no pools found');
      return;
    }

    for (const [level, entries] of Object.entries(pools)) {
      if (!['N', 'R', 'SR', 'SSR', 'UR'].includes(level)) {
        this.logger.warn(`  Unknown adjective pool level: ${level}`);
        continue;
      }

      const pool: AdjectiveEntry[] = [];
      for (const entry of entries) {
        pool.push({
          id: entry.id || '?',
          prompt_chinese: entry.prompt_chinese || '',
          prompt_en: entry.prompt_en || '',
          level: level as AtomLevel,
          score: 0,
        });
      }
      this.adjectivePools[level as AtomLevel] = pool;
    }

    const total = Object.values(this.adjectivePools).reduce((s, p) => s + p.length, 0);
    this.logger.log(`  Loaded ${total} adjective entries across ${Object.keys(pools).length} pools`);
  }

  // ========== 工具 ==========

  private readYaml(filename: string): any {
    const filepath = path.join(ATOMS_DIR, filename);
    if (!fs.existsSync(filepath)) {
      this.logger.warn(`  File not found: ${filepath}`);
      return {};
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    return yaml.load(content) || {};
  }
}
