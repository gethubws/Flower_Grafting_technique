import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AtomLoaderService } from '../atom/atom-loader.service';
import { AtomInheritanceService } from '../atom/atom-inheritance.service';
import { AtomFusionRuleService } from '../atom/atom-fusion-rule.service';
import { AtomScoreService } from '../atom/atom-score.service';
import { AtomDefinition, AtomLevel } from '../atom/atom.types';

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly atomLoader: AtomLoaderService,
    private readonly inheritance: AtomInheritanceService,
    private readonly ruleEngine: AtomFusionRuleService,
    private readonly scoreService: AtomScoreService,
  ) {}

  /**
   * 直接设置花的稀有度。
   */
  async setRarity(flowerId: string, rarity: string) {
    const f = await this.prisma.flower.update({
      where: { id: flowerId },
      data: { rarity },
    });
    return { flowerId: f.id, rarity: f.rarity };
  }

  /**
   * 设置花的生长阶段和进度。
   */
  async setStage(flowerId: string, stage: string, progress: number) {
    const f = await this.prisma.flower.update({
      where: { id: flowerId },
      data: { stage, progress },
    });
    return { flowerId: f.id, stage: f.stage, progress: f.progress };
  }

  /**
   * 加速稳定化进度。
   */
  async boostStability(flowerId: string, count: number) {
    const f = await this.prisma.flower.findUnique({ where: { id: flowerId } });
    if (!f) throw new Error('Flower not found');

    const newProgress = Math.min((f.stabilityProgress || 0) + count, 10);
    const isFoundation = newProgress >= 10;

    await this.prisma.flower.update({
      where: { id: flowerId },
      data: {
        stabilityProgress: newProgress,
        isFoundation,
        ...(isFoundation ? { foundationName: f.name || flowerId } : {}),
      },
    });

    if (isFoundation) {
      const name = (f.name || '').replace('种子', '').replace(/^稀有|^珍稀|^极品|^传说/, '');
      await this.prisma.user.update({
        where: { id: f.ownerId },
        data: { title: `${name}育种家` },
      });
    }

    return { flowerId, progress: newProgress, becameFoundation: isFoundation };
  }

  /**
   * 创建一株任意稀有度+阶段的融合花（放入仓库）。
   */
  async spawnFlower(userId: string, atomIds: string[], rarity: string, stage: string) {
    const atoms = this.atomLoader.getAtomsByIds(atomIds);
    if (atoms.length === 0) throw new Error('No valid atoms found');

    const score = this.scoreService.calculateScore(atoms);

    const f = await this.prisma.flower.create({
      data: {
        ownerId: userId,
        name: `DEBUG ${rarity} Flower`,
        rarity,
        atoms: atoms as any,
        factorScore: score,
        stage,
        progress: stage === 'BLOOMING' ? 100 : stage === 'SEED' ? 0 : 50,
        isShopSeed: false,
        parentAId: 'debug-a',
        parentBId: 'debug-b',
        location: 'WAREHOUSE',
        sellPrice: 100,
      },
    });

    return { flowerId: f.id, atoms: atoms.map((a) => a.id), rarity, score };
  }

  /**
   * 模拟性状稳定全流程：
   * 1. 创建一个母株（指定稀有度+因子）
   * 2. 循环10次：创建"相似"融合结果 → 触发稳定性判定
   *
   * 最终母株应成为奠基种。
   */
  async simulateStabilization(userId: string, rarity: string, atomIds: string[]) {
    const atoms = this.atomLoader.getAtomsByIds(atomIds);
    if (atoms.length === 0) throw new Error('No valid atoms found');

    const score = this.scoreService.calculateScore(atoms);

    // 创建母株
    const mother = await this.prisma.flower.create({
      data: {
        ownerId: userId,
        name: `SIM ${rarity} Mother`,
        rarity,
        atoms: atoms as any,
        factorScore: score,
        stage: 'BLOOMING',
        progress: 100,
        isShopSeed: false,
        parentAId: 'sim-a',
        parentBId: 'sim-b',
        location: 'WAREHOUSE',
        sellPrice: 1000,
        stabilityProgress: 0,
      },
    });

    const log: string[] = [];
    log.push(`Mother created: ${mother.id} (${rarity}, ${atoms.length} atoms, score=${score})`);

    // 模拟 10 次相似融合
    for (let i = 0; i < 10; i++) {
      // 创建一个与母株稀有度相同、因子差异≤3的融合结果
      let childAtoms: AtomDefinition[];

      if (i % 2 === 0) {
        // 偶数次：基因完全相同
        childAtoms = [...atoms];
      } else {
        // 奇数次：基因差异1-2个（模拟正常波动）
        childAtoms = atoms.length > 1
          ? atoms.slice(0, -1) // 少一个
          : [...atoms];
      }

      const childScore = this.scoreService.calculateScore(childAtoms);

      const child = await this.prisma.flower.create({
        data: {
          ownerId: userId,
          name: `SIM Child ${i + 1}`,
          rarity,
          atoms: childAtoms as any,
          factorScore: childScore,
          stage: 'GROWING',
          progress: 50,
          isShopSeed: false,
          parentAId: 'sim-child-a',
          parentBId: 'sim-child-b',
          stabilityTargetId: mother.id,
        },
      });

      // 模拟稳定性判定（调用 checkStability 逻辑）
      const motherRaw = mother.atoms as any;
      const motherIds: string[] = Array.isArray(motherRaw)
        ? motherRaw.map((a: any) => (typeof a === 'string' ? a : (a.id || a.atomId)))
        : [];
      const childIds = childAtoms.map((a) => a.id);

      const setA = new Set(motherIds);
      const setB = new Set(childIds);
      let diff = 0;
      for (const a of setA) if (!setB.has(a)) diff++;
      for (const b of setB) if (!setA.has(b)) diff++;

      if (diff <= 3) {
        const newProgress = (mother.stabilityProgress || 0) + 1;
        const isFoundation = newProgress >= 10;

        await this.prisma.flower.update({
          where: { id: mother.id },
          data: {
            stabilityProgress: newProgress,
            isFoundation,
            ...(isFoundation ? { foundationName: mother.name } : {}),
          },
        });

        if (isFoundation) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { title: `${rarity}育种家` },
          });
        }

        log.push(
          `  Round ${i + 1}: SIMILAR (diff=${diff}) → progress ${newProgress}/10` +
          (isFoundation ? ' ★ FOUNDATION CERTIFIED!' : ''),
        );

        // 更新内存中的 mother 对象用于下次比较
        (mother as any).stabilityProgress = newProgress;
        (mother as any).isFoundation = isFoundation;
      } else {
        log.push(`  Round ${i + 1}: DIVERGED (diff=${diff}) — skipped`);
      }
    }

    const final = await this.prisma.flower.findUnique({ where: { id: mother.id } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    return {
      motherId: mother.id,
      finalProgress: final?.stabilityProgress,
      isFoundation: final?.isFoundation,
      title: user?.title,
      log,
    };
  }

  /**
   * 返回所有已加载因子和规则（调试查看）。
   */
  getAtoms() {
    return {
      atoms: this.atomLoader.getAllAtoms().map((a) => ({ id: a.id, category: a.category, level: a.level, score: a.score })),
      total: this.atomLoader.getAllAtoms().length,
    };
  }

  getFusionRules() {
    return this.atomLoader.getFusionRules();
  }

  getProbabilityTable() {
    return this.atomLoader.getProbabilityTable();
  }

  getAdjectivePools() {
    return this.atomLoader.getAdjectivePools();
  }
}
