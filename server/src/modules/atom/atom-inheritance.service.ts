import { Injectable, Logger } from '@nestjs/common';
import { AtomDefinition, InheritanceResult } from './atom.types';

/**
 * 原子概率继承服务
 *
 * 核心规则：每个父本原子独立 50% 概率被继承。
 * - 全部丢失 → 大失败（概率约 0.5^(n+m)）
 * - 全部继承 → 多倍体（同因子重复出现，不合并）
 */
@Injectable()
export class AtomInheritanceService {
  private readonly logger = new Logger(AtomInheritanceService.name);

  /**
   * 执行单边继承：对一组原子，每个独立 50% 概率。
   * @returns 被继承的原子列表
   */
  inherit(atoms: AtomDefinition[]): AtomDefinition[] {
    return atoms.filter(() => Math.random() < 0.5);
  }

  /**
   * 执行完整的双亲继承 + 合并。
   *
   * @param parentA 亲本 A 的原子列表
   * @param parentB 亲本 B 的原子列表
   * @returns InheritanceResult（包含合并后的原子列表 + 丢失计数）
   */
  execute(
    parentA: AtomDefinition[],
    parentB: AtomDefinition[],
  ): InheritanceResult {
    const inheritedFromA = this.inherit(parentA);
    const inheritedFromB = this.inherit(parentB);

    const inheritedAtoms = [...inheritedFromA, ...inheritedFromB];
    const droppedFromA = parentA.length - inheritedFromA.length;
    const droppedFromB = parentB.length - inheritedFromB.length;

    this.logger.debug(
      `Inheritance: A ${inheritedFromA.length}/${parentA.length}, ` +
      `B ${inheritedFromB.length}/${parentB.length} → total ${inheritedAtoms.length}`,
    );

    return {
      inheritedAtoms,
      droppedCount: droppedFromA + droppedFromB,
    };
  }

  /**
   * 计算多倍体计数：同 id 出现次数-1 的总和。
   * 例：[a, a, b, c, c, c] → a:1, c:2 → 总计 3
   */
  countDoubles(atoms: AtomDefinition[]): number {
    const counts = new Map<string, number>();
    for (const atom of atoms) {
      counts.set(atom.id, (counts.get(atom.id) || 0) + 1);
    }
    let doubles = 0;
    for (const count of counts.values()) {
      if (count > 1) doubles += count - 1;
    }
    return doubles;
  }

  /**
   * 统计继承详情（调试用）
   */
  describe(
    parentA: AtomDefinition[],
    parentB: AtomDefinition[],
    result: AtomDefinition[],
  ): {
    fromA: string[];
    fromB: string[];
    lostA: string[];
    lostB: string[];
    doubleIds: string[];
  } {
    const resultIds = result.map((a) => a.id);

    const fromA: string[] = [];
    const lostA: string[] = [];
    for (const atom of parentA) {
      const idx = resultIds.indexOf(atom.id);
      if (idx >= 0) {
        fromA.push(atom.id);
        resultIds.splice(idx, 1); // 移除已匹配的（处理多倍体）
      } else {
        lostA.push(atom.id);
      }
    }

    const fromB: string[] = [];
    const lostB: string[] = [];
    for (const atom of parentB) {
      const idx = resultIds.indexOf(atom.id);
      if (idx >= 0) {
        fromB.push(atom.id);
        resultIds.splice(idx, 1);
      } else {
        lostB.push(atom.id);
      }
    }

    // 检测多倍体
    const idCounts = new Map<string, number>();
    for (const atom of result) {
      idCounts.set(atom.id, (idCounts.get(atom.id) || 0) + 1);
    }
    const doubleIds: string[] = [];
    for (const [id, count] of idCounts) {
      if (count > 1) doubleIds.push(`${id}×${count}`);
    }

    return { fromA, fromB, lostA, lostB, doubleIds };
  }
}
