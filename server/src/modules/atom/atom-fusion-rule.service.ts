import { Injectable, Logger } from '@nestjs/common';
import { AtomLoaderService } from './atom-loader.service';
import {
  AtomDefinition,
  FusionRule,
  FusionRuleResult,
} from './atom.types';

/**
 * 融合规则引擎
 *
 * 按 priority 降序匹配规则，每条规则只触发一次。
 * 匹配后执行 replace_atoms 替换 + produce_atom 产生新因子。
 */
@Injectable()
export class AtomFusionRuleService {
  private readonly logger = new Logger(AtomFusionRuleService.name);

  constructor(private readonly atomLoader: AtomLoaderService) {}

  /**
   * 对继承后的原子列表应用所有匹配的融合规则。
   *
   * @param atoms 继承+合并后的原子列表（可包含重复/多倍体）
   * @returns 应用规则后的结果（新原子列表 + 触发详情）
   */
  apply(atoms: AtomDefinition[]): FusionRuleResult {
    const rules = this.atomLoader.getFusionRules();
    const appliedRules: string[] = [];
    const producedAtoms: AtomDefinition[] = [];
    const replacedAtomIds: string[] = [];
    const promptModifiers: string[] = [];

    // 使用 mutable 数组
    let current = [...atoms];

    for (const rule of rules) {
      if (this.matches(current, rule)) {
        this.logger.debug(`Fusion rule matched: ${rule.name}`);

        // 执行替换
        const replaceIds: string[] = rule.result.replace_atoms || [];
        if (replaceIds.length > 0) {
          current = this.removeAtoms(current, replaceIds);
          replacedAtomIds.push(...replaceIds);
        }

        // 产生新因子
        const newAtom = this.atomLoader.getAtom(rule.result.produce_atom);
        if (newAtom) {
          current.push(newAtom);
          producedAtoms.push(newAtom);
        } else {
          this.logger.warn(
            `Fusion rule "${rule.name}" produce_atom "${rule.result.produce_atom}" not found`,
          );
        }

        // 收集 prompt 修饰词
        if (rule.result.prompt_modifier) {
          promptModifiers.push(rule.result.prompt_modifier);
        }

        appliedRules.push(rule.name);
      }
    }

    return {
      appliedRules,
      producedAtoms,
      replacedAtomIds,
      promptModifiers,
    };
  }

  /**
   * 判断一条规则是否匹配当前原子列表。
   */
  private matches(atoms: AtomDefinition[], rule: FusionRule): boolean {
    const { condition } = rule;

    switch (condition.type) {
      case 'color_count':
        return this.checkColorCount(atoms, condition);
      case 'atom_present':
        return this.checkAtomPresent(atoms, condition);
      case 'category_count':
        return this.checkCategoryCount(atoms, condition);
      default:
        this.logger.warn(`Unknown fusion condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * color_count：指定分类下去重后的因子种类数 ≥ min_count（且 ≤ max_count）。
   */
  private checkColorCount(
    atoms: AtomDefinition[],
    condition: FusionRule['condition'],
  ): boolean {
    const targetCategories = condition.categories || [];
    const uniqueIds = new Set<string>();

    for (const atom of atoms) {
      if (targetCategories.includes(atom.category)) {
        uniqueIds.add(atom.id);
      }
    }

    const count = uniqueIds.size;
    const minOk = condition.min_count === undefined || count >= condition.min_count;
    const maxOk = condition.max_count === undefined || count <= condition.max_count;
    return minOk && maxOk;
  }

  /**
   * atom_present：指定的所有 atom_ids 都在当前原子列表中存在。
   */
  private checkAtomPresent(
    atoms: AtomDefinition[],
    condition: FusionRule['condition'],
  ): boolean {
    const requiredIds = condition.atom_ids || [];
    if (requiredIds.length === 0) return false;

    const presentIds = new Set(atoms.map((a) => a.id));
    return requiredIds.every((id) => presentIds.has(id));
  }

  /**
   * category_count：指定分类下的原子总数（含重复） ≥ min_count。
   */
  private checkCategoryCount(
    atoms: AtomDefinition[],
    condition: FusionRule['condition'],
  ): boolean {
    const targetCategories = condition.categories || [];
    const count = atoms.filter((a) => targetCategories.includes(a.category)).length;
    return condition.min_count === undefined || count >= condition.min_count;
  }

  /**
   * 从原子列表中移除指定 id 的原子（每个 id 只移除一次）。
   */
  private removeAtoms(atoms: AtomDefinition[], idsToRemove: string[]): AtomDefinition[] {
    const removeSet = new Set(idsToRemove);
    const result: AtomDefinition[] = [];
    for (const atom of atoms) {
      if (removeSet.has(atom.id)) {
        removeSet.delete(atom.id); // 只移除一次
      } else {
        result.push(atom);
      }
    }
    return result;
  }
}
