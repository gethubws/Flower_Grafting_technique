import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { FusionGateway } from './fusion.gateway';
import { AtomLoaderService } from '../atom/atom-loader.service';
import { AtomInheritanceService } from '../atom/atom-inheritance.service';
import { AtomFusionRuleService } from '../atom/atom-fusion-rule.service';
import { AtomScoreService } from '../atom/atom-score.service';
import { AtomDefinition } from '../atom/atom.types';
import {
  Stage,
  FailType,
  SoilType,
  SOIL_MODIFIERS,
  FUSION_REWARDS,
  TransactionType,
  Rarity,
} from '../../common/enums';
import { FusionRequestDto } from './dto/fusion-request.dto';
import { FusionResponseDto } from './dto/fusion-response.dto';

@Injectable()
export class FusionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly aiGateway: AiGatewayService,
    private readonly fusionGateway: FusionGateway,
    private readonly atomLoader: AtomLoaderService,
    private readonly inheritance: AtomInheritanceService,
    private readonly ruleEngine: AtomFusionRuleService,
    private readonly scoreService: AtomScoreService,
  ) {}

  // ========================
  // 公开入口
  // ========================

  async executeFusion(
    userId: string,
    dto: FusionRequestDto,
  ): Promise<FusionResponseDto> {
    // 1. 校验亲本
    const parents = await this.validateParents(userId, dto.parentAId, dto.parentBId);

    // 2. 计算成功率
    const { successRate } = this.calculateSuccessRate(dto.soil, parents.a, parents.b);

    // 3. 判定成败
    const roll = Math.random() * 100;
    const success = roll < successRate;

    if (!success) {
      return this.handleFailure(userId, parents.a, parents.b, dto.soil, roll, successRate);
    }

    // 4. 概率继承 + 融合规则 + 积分计算 + 稀有度抽取
    const atomsA = this.resolveAtoms(parents.a.atoms);
    const atomsB = this.resolveAtoms(parents.b.atoms);

    const inheritResult = this.inheritance.execute(atomsA, atomsB);
    let mergedAtoms = inheritResult.inheritedAtoms;

    // 融合规则
    const ruleResult = this.ruleEngine.apply(mergedAtoms);
    // 应用融合规则产生的原子（replace 在 ruleEngine 内部已完成）
    mergedAtoms = ruleResult.producedAtoms.length > 0
      ? this.applyFusionReplacements(mergedAtoms, ruleResult)
      : mergedAtoms;

    // 积分 + 稀有度
    const score = this.scoreService.calculateScore(mergedAtoms);
    const rarity = this.scoreService.rollRarity(score);

    // 形容词抽取（R+）
    const adjective = this.scoreService.rollAdjective(rarity);
    if (adjective) {
      mergedAtoms.push(this.scoreService.adjectiveToAtom(adjective));
    }

    // 双倍计数
    const doubleCount = this.inheritance.countDoubles(mergedAtoms);

    // 5. 首次奖励判定
    const isFirstTime = await this.checkFirstTime(userId, dto.parentAId, dto.parentBId, rarity);

    // 6. 事务
    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 标记亲本消耗
      await tx.flower.update({ where: { id: parents.a.id }, data: { consumedAt: now } });
      await tx.flower.update({ where: { id: parents.b.id }, data: { consumedAt: now } });

      // 释放槽位
      await tx.gardenSlot.updateMany({
        where: { flowerId: { in: [parents.a.id, parents.b.id] } },
        data: { flowerId: null },
      });

      // 融合花父本A的种子名（用于生长期图片）
      const growthSeed = parents.a.isShopSeed
        ? await tx.seed.findFirst({ where: { name: parents.a.name?.replace('种子', '') || '' } })
        : null;

      // 创建 GROWING 融合花
      const flower = await tx.flower.create({
        data: {
          ownerId: userId,
          name: this.generateName(parents.a.name, parents.b.name, rarity),
          parentAId: parents.a.id,
          parentBId: parents.b.id,
          rarity,
          atoms: mergedAtoms as any,
          factorScore: score,
          stage: 'GROWING',
          progress: 30,
          isShopSeed: false,
          growthImageSeed: growthSeed?.name || parents.a.name || null,
        },
      });

      // 自动种植到第一个空槽位
      const emptySlot = await tx.gardenSlot.findFirst({
        where: { userId, flowerId: null },
        orderBy: { position: 'asc' },
      });
      if (emptySlot) {
        await tx.gardenSlot.update({
          where: { id: emptySlot.id },
          data: { flowerId: flower.id },
        });
      }

      // 奖励
      const rewards = FUSION_REWARDS[rarity as Rarity];
      const gold = isFirstTime ? rewards.gold + rewards.firstTimeBonus.gold : rewards.gold;
      const xp = isFirstTime ? rewards.xp + rewards.firstTimeBonus.xp : rewards.xp;

      await tx.user.update({
        where: { id: userId },
        data: { gold: { increment: gold }, xp: { increment: xp } },
      });

      await tx.transactionLog.create({
        data: {
          userId,
          type: TransactionType.FUSION_REWARD,
          currency: 'GOLD',
          amount: gold,
          balance: 0,
          reason: `Fusion reward: ${rarity}${isFirstTime ? ' (first time)' : ''}`,
          relatedId: flower.id,
        },
      });

      await tx.fusionLog.create({
        data: {
          userId,
          parentAId: parents.a.id,
          parentBId: parents.b.id,
          soil: dto.soil,
          ritual: dto.ritual,
          success: true,
          resultRarity: rarity,
          resultAtoms: mergedAtoms as any,
          resultFlowerId: flower.id,
          factorScore: score,
          isFirstTime,
          rewardGold: gold,
          rewardXp: xp,
        },
      });

      // 性状稳定判定（如果传了 stabilityTargetId）
      let stabilityResult: any = null;
      if (dto.stabilityTargetId) {
        stabilityResult = await this.checkStability(tx, dto.stabilityTargetId, rarity, mergedAtoms as AtomDefinition[]);
      }

      return { flower, gold, xp, isFirstTime, score, inheritResult, ruleResult, doubleCount, stabilityResult };
    });

    const atoms = mergedAtoms.map((a: AtomDefinition) => ({
      id: a.id,
      category: a.category,
      level: a.level,
      prompt_chinese: a.prompt_chinese,
    }));

    const fusionResponse: FusionResponseDto = {
      success: true,
      flowerId: result.flower.id,
      rarity,
      atoms: atoms as any,
      factorScore: result.score,
      inheritedCount: result.inheritResult.inheritedAtoms.length,
      droppedCount: result.inheritResult.droppedCount,
      appliedRules: result.ruleResult.appliedRules,
      doubleCount: result.doubleCount,
      stabilityResult: result.stabilityResult,
      reward: { gold: result.gold, xp: result.xp },
      isFirstTime: result.isFirstTime,
    };

    // 异步生成图片 + 推送
    this.generateAndPush(userId, result.flower.id, rarity, mergedAtoms, result.gold, result.xp, result.isFirstTime);

    return fusionResponse;
  }

  // ========================
  // 解析 atoms（兼容旧的 string[] 和新的 object[]）
  // ========================

  private resolveAtoms(rawAtoms: any): AtomDefinition[] {
    if (!Array.isArray(rawAtoms)) return [];

    // 新格式: [{ id, category, ... }]
    if (rawAtoms.length > 0 && typeof rawAtoms[0] === 'object') {
      return rawAtoms.map((entry: any) => {
        // 如果已经是完整对象，直接用
        if (entry.prompt_chinese && entry.category) {
          return entry as AtomDefinition;
        }
        // 如果是 { atomId, guaranteed } 格式（种子），展开
        const def = this.atomLoader.getAtom(entry.atomId || entry.id);
        if (def) return def;
        // fallback（不应该到达）
        return {
          id: entry.atomId || entry.id || '?',
          category: 'unknown',
          prompt_chinese: '',
          prompt_en: '',
          level: 'N' as const,
          score: 0,
        };
      }).filter((a: AtomDefinition) => a.id !== '?');
    }

    // 旧格式: string[]（兼容）
    return rawAtoms
      .map((id: string) => this.atomLoader.getAtom(id))
      .filter(Boolean) as AtomDefinition[];
  }

  // ========================
  // 应用融合规则产生的原子（ruleEngine 内部已做 replace，这里确保最终列表正确）
  // ========================

  private applyFusionReplacements(
    atoms: AtomDefinition[],
    ruleResult: { producedAtoms: AtomDefinition[]; replacedAtomIds: string[] },
  ): AtomDefinition[] {
    // ruleEngine.apply() 已经返回了处理后的 atoms，这里只是额外确保
    // 如果 ruleResult 表明有新产生的原子还没加入，补上
    let result = [...atoms];
    if (ruleResult.producedAtoms.length > 0) {
      result = [...result, ...ruleResult.producedAtoms];
    }
    return result;
  }

  // ========================
  // 性状稳定判定
  // ========================

  private async checkStability(
    tx: any,
    stabilityTargetId: string,
    resultRarity: string,
    resultAtoms: AtomDefinition[],
  ) {
    const mother = await tx.flower.findUnique({ where: { id: stabilityTargetId } });
    if (!mother || mother.consumedAt) return null;

    // 稀有度一致？
    if (mother.rarity !== resultRarity) {
      return { similar: false, reason: 'rarity_mismatch' };
    }

    // 基因差异 ≤ 3？
    const motherRaw = mother.atoms as any;
    const motherAtoms: string[] = Array.isArray(motherRaw)
      ? motherRaw.map((a: any) => (typeof a === 'string' ? a : a.id))
      : [];
    const resultAtomIds = resultAtoms.map((a: AtomDefinition) => a.id);

    const setA = new Set(motherAtoms);
    const setB = new Set(resultAtomIds);
    let diff = 0;
    for (const a of setA) if (!setB.has(a)) diff++;
    for (const b of setB) if (!setA.has(b)) diff++;

    if (diff > 3) {
      return { similar: false, reason: 'gene_divergence', diff };
    }

    // 相似 → 进度+1
    const newProgress = (mother.stabilityProgress || 0) + 1;
    const isFoundation = newProgress >= 10;

    await tx.flower.update({
      where: { id: stabilityTargetId },
      data: {
        stabilityProgress: newProgress,
        isFoundation,
        ...(isFoundation ? { foundationName: mother.name || mother.id } : {}),
      },
    });

    // 如果成为奠基种，授予称号
    if (isFoundation) {
      const titleName = (mother.name || '未知').replace('种子', '').replace(/^稀有|^珍稀|^极品|^传说/, '');
      await tx.user.update({
        where: { id: mother.ownerId },
        data: { title: `${titleName}育种家` },
      });
    }

    return {
      similar: true,
      progress: newProgress,
      becameFoundation: isFoundation,
      diff,
    };
  }

  // ========================
  // 校验亲本（不变）
  // ========================

  private async validateParents(userId: string, aId: string, bId: string) {
    if (aId === bId) throw new BadRequestException('Cannot fuse a flower with itself');

    const [parentA, parentB] = await Promise.all([
      this.prisma.flower.findUnique({ where: { id: aId } }),
      this.prisma.flower.findUnique({ where: { id: bId } }),
    ]);

    if (!parentA || parentA.ownerId !== userId) throw new NotFoundException('Parent A not found');
    if (!parentB || parentB.ownerId !== userId) throw new NotFoundException('Parent B not found');
    if (parentA.consumedAt) throw new BadRequestException('Parent A has already been consumed');
    if (parentB.consumedAt) throw new BadRequestException('Parent B has already been consumed');

    const fusableStages = [Stage.GROWING, Stage.MATURE];
    if (!fusableStages.includes(parentA.stage as Stage)) {
      throw new BadRequestException(`Parent A must be GROWING/MATURE (got ${parentA.stage})`);
    }
    if (!fusableStages.includes(parentB.stage as Stage)) {
      throw new BadRequestException(`Parent B must be GROWING/MATURE (got ${parentB.stage})`);
    }

    return { a: parentA, b: parentB };
  }

  // ========================
  // 成功率（不变）
  // ========================

  private calculateSuccessRate(soil: SoilType, parentA: { stage: string }, parentB: { stage: string }) {
    let rate = 75;
    rate += SOIL_MODIFIERS[soil].successBonus;
    if (parentA.stage === Stage.MATURE) rate -= 5;
    if (parentB.stage === Stage.MATURE) rate -= 5;
    return { successRate: Math.max(rate, 5) };
  }

  // ========================
  // 首次奖励判定（不变）
  // ========================

  private async checkFirstTime(userId: string, parentAId: string, parentBId: string, rarity: string) {
    const existing = await this.prisma.fusionLog.findFirst({
      where: {
        userId,
        success: true,
        resultRarity: rarity,
        OR: [
          { parentAId, parentBId },
          { parentAId: parentBId, parentBId: parentAId },
        ],
      },
    });
    return !existing;
  }

  // ========================
  // 失败处理（不变）
  // ========================

  private async handleFailure(
    userId: string,
    parentA: { id: string; stage: string; name: string | null },
    parentB: { id: string; stage: string; name: string | null },
    soil: SoilType,
    roll: number,
    successRate: number,
  ): Promise<FusionResponseDto> {
    const failRange = 100 - successRate;
    const graveThreshold = successRate + failRange * 0.3;
    const isGrave = roll < graveThreshold;
    const failType = isGrave ? FailType.GRAVE : FailType.NORMAL;

    await this.prisma.flower.update({
      where: { id: parentA.id },
      data: { consumedAt: new Date(), ...(isGrave ? { stage: Stage.RECOVERING } : {}) },
    });

    await this.prisma.gardenSlot.updateMany({
      where: { flowerId: parentA.id },
      data: { flowerId: null },
    });

    await this.prisma.fusionLog.create({
      data: {
        userId,
        parentAId: parentA.id,
        parentBId: parentB.id,
        soil,
        success: false,
        failType,
        resultAtoms: [],
      },
    });

    return { success: false, failType, atoms: [], factorScore: 0 };
  }

  // ========================
  // AI 图片生成 + Socket 推送（不变，但 atoms 格式变了）
  // ========================

  private async generateAndPush(
    userId: string,
    flowerId: string,
    rarity: string,
    atoms: AtomDefinition[],
    gold: number,
    xp: number,
    isFirstTime: boolean,
  ) {
    try {
      const atomIds = atoms.map((a) => a.id);
      const genResult = await this.aiGateway.generateImage({
        flowerId,
        userId,
        prompt: '',
        atoms: atomIds,
        rarity,
        stage: 'GROWING',
        seed: Date.now(),
      });

      await this.prisma.flower.update({
        where: { id: flowerId },
        data: { imageUrl: genResult.imageUrl, growthImageUrl: genResult.imageUrl },
      });

      this.fusionGateway.emitFusionComplete(userId, {
        flowerId,
        rarity,
        atoms: atomIds,
        imageUrl: genResult.imageUrl,
        reward: { gold, xp },
        isFirstTime,
      });
    } catch (err: any) {
      console.error(`Image generation failed for flower ${flowerId}:`, err.message);
      this.fusionGateway.emitFusionComplete(userId, {
        flowerId,
        rarity,
        atoms: atoms.map((a) => a.id),
        imageUrl: null,
        reward: { gold, xp },
        isFirstTime,
      });
    }
  }

  // ========================
  // 花名生成（不变）
  // ========================

  private generateName(nameA: string | null, nameB: string | null, rarity: string): string {
    const partA = (nameA || '未知').replace('种子', '');
    const partB = (nameB || '未知').replace('种子', '');
    const prefix = { N: '', R: '稀有', SR: '珍稀', SSR: '极品', UR: '传说' }[rarity] || '';
    return `${prefix}${partA}×${partB}`;
  }
}
