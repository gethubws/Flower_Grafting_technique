// ============================================
// Atom 模块 — 类型定义
// ============================================

/** 因子稀有度 */
export type AtomLevel = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

/** 单个因子定义（对应 YAML 文件中的 atom 条目） */
export interface AtomDefinition {
  id: string;
  category: string;
  prompt_chinese: string;
  prompt_en: string;
  level: AtomLevel;
  score: number;
  incompatible?: string[];
  description?: string;
}

/** 分类定义 */
export interface CategoryDefinition {
  label: string;
  weight: number;
}

/** 融合规则条件类型 */
export type FusionConditionType = 'color_count' | 'atom_present' | 'category_count';

/** 融合规则条件 */
export interface FusionCondition {
  type: FusionConditionType;
  min_count?: number;
  max_count?: number;
  atom_ids?: string[];
  categories?: string[];
}

/** 融合规则结果 */
export interface FusionResult {
  replace_atoms?: string[];
  produce_atom: string;
  prompt_modifier?: string;
}

/** 单条融合规则 */
export interface FusionRule {
  name: string;
  description?: string;
  priority: number;
  condition: FusionCondition;
  result: FusionResult;
}

/** 形容词池条目 */
export interface AdjectiveEntry {
  id: string;
  prompt_chinese: string;
  prompt_en: string;
  level: AtomLevel;
  score: number;
}

/** 形容词池（按稀有度分组） */
export type AdjectivePools = Record<AtomLevel, AdjectiveEntry[]>;

/** 稀有度概率表（9 个挡位） */
export interface RarityProbabilityRow {
  N: number;
  R: number;
  SR: number;
  SSR: number;
  UR: number;
}

/** 因子继承结果 */
export interface InheritanceResult {
  inheritedAtoms: AtomDefinition[];
  droppedCount: number;
}

/** 融合规则匹配结果 */
export interface FusionRuleResult {
  appliedRules: string[];          // 被触发的规则名称列表
  producedAtoms: AtomDefinition[]; // 规则产生的新因子
  replacedAtomIds: string[];       // 被替换掉的因子 id
  promptModifiers: string[];       // 额外的 prompt 修饰词
}

/** 完整合并结果 */
export interface MergeResult {
  atoms: AtomDefinition[];
  score: number;
  inheritedFromA: number;
  inheritedFromB: number;
  totalBeforeFusion: number;
  appliedRules: string[];
  doubleCount: number;  // 多倍体计数（同 id 出现次数-1 的总和）
}
