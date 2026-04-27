import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { FusionGateway } from './fusion.gateway';
import {
  Stage,
  Rarity,
  RARITY_WEIGHTS,
  FailType,
  SoilType,
  SOIL_MODIFIERS,
  FUSION_REWARDS,
  TransactionType,
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
  ) {}

  // ========================
  // 公开入口
  // ========================

  async executeFusion(
    userId: string,
    dto: FusionRequestDto,
  ): Promise<FusionResponseDto> {
    // 1. 校验亲本
    const parents = await this.validateParents(
      userId,
      dto.parentAId,
      dto.parentBId,
    );

    // 2. 计算成功率
    const { successRate, isMaturePenalty } = this.calculateSuccessRate(
      dto.soil,
      parents.a,
      parents.b,
    );

    // 3. 判定成败
    const roll = Math.random() * 100;
    const success = roll < successRate;

    if (!success) {
      return this.handleFailure(
        userId,
        parents.a,
        parents.b,
        dto.soil,
        roll,
        successRate,
      );
    }

    // 4. 成功路径 — 抽取珍稀度
    const rarity = this.rollRarity();

    // 5. 合并原子
    const atoms = this.mergeAtoms(
      parents.a.atoms as string[],
      parents.b.atoms as string[],
      rarity,
    );

    // 6. 首次奖励判定
    const isFirstTime = await this.checkFirstTime(
      userId,
      dto.parentAId,
      dto.parentBId,
      rarity,
    );

    // 7. 事务：消耗亲本（标记 consumedAt）+ 释放槽位 + 创建融合花 + 写日志 + 发奖励
    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 标记亲本 A、B 为已消耗（保留记录供历史查询）
      await tx.flower.update({
        where: { id: parents.a.id },
        data: { consumedAt: now },
      });
      await tx.flower.update({
        where: { id: parents.b.id },
        data: { consumedAt: now },
      });

      // 释放 GardenSlot（SET NULL）
      await tx.gardenSlot.updateMany({
        where: { flowerId: { in: [parents.a.id, parents.b.id] } },
        data: { flowerId: null },
      });

      // 创建 BLOOMING 融合花
      const flower = await tx.flower.create({
        data: {
          ownerId: userId,
          name: this.generateName(parents.a.name, parents.b.name, rarity),
          parentAId: parents.a.id,
          parentBId: parents.b.id,
          rarity,
          atoms: atoms as any,
          stage: 'BLOOMING',
          progress: 100,
          isShopSeed: false,
        },
      });

      // 奖励计算
      const rewards = FUSION_REWARDS[rarity];
      const gold = isFirstTime
        ? rewards.gold + rewards.firstTimeBonus.gold
        : rewards.gold;
      const xp = isFirstTime
        ? rewards.xp + rewards.firstTimeBonus.xp
        : rewards.xp;

      // 更新金币
      await tx.user.update({
        where: { id: userId },
        data: { gold: { increment: gold }, xp: { increment: xp } },
      });

      // 写 TransactionLog
      await tx.transactionLog.create({
        data: {
          userId,
          type: TransactionType.FUSION_REWARD,
          currency: 'GOLD',
          amount: gold,
          balance: 0, // will be updated by UserService
          reason: `Fusion reward: ${rarity}${isFirstTime ? ' (first time)' : ''}`,
          relatedId: flower.id,
        },
      });

      // 写 FusionLog
      await tx.fusionLog.create({
        data: {
          userId,
          parentAId: parents.a.id,
          parentBId: parents.b.id,
          soil: dto.soil,
          ritual: dto.ritual,
          success: true,
          resultRarity: rarity,
          resultAtoms: atoms as any,
          resultFlowerId: flower.id,
          isFirstTime,
          rewardGold: gold,
          rewardXp: xp,
        },
      });

      return { flower, gold, xp, isFirstTime };
    });

    const fusionResponse: FusionResponseDto = {
      success: true,
      flowerId: result.flower.id,
      rarity,
      atoms,
      reward: { gold: result.gold, xp: result.xp },
      isFirstTime: result.isFirstTime,
    };

    // 8. 异步生成图片 + 更新 Flower + Socket 推送（不阻塞响应）
    this.generateAndPush(
      userId,
      result.flower.id,
      rarity,
      atoms,
      result.gold,
      result.xp,
      result.isFirstTime,
    );

    return fusionResponse;
  }

  // ========================
  // 1. 校验亲本
  // ========================

  private async validateParents(userId: string, aId: string, bId: string) {
    if (aId === bId) {
      throw new BadRequestException('Cannot fuse a flower with itself');
    }

    const [parentA, parentB] = await Promise.all([
      this.prisma.flower.findUnique({ where: { id: aId } }),
      this.prisma.flower.findUnique({ where: { id: bId } }),
    ]);

    if (!parentA || parentA.ownerId !== userId) {
      throw new NotFoundException('Parent A not found');
    }
    if (!parentB || parentB.ownerId !== userId) {
      throw new NotFoundException('Parent B not found');
    }

    // 不能被消耗过
    if (parentA.consumedAt) {
      throw new BadRequestException('Parent A has already been consumed');
    }
    if (parentB.consumedAt) {
      throw new BadRequestException('Parent B has already been consumed');
    }

    // 必须处于 GROWING 或 MATURE 阶段
    const fusableStages = [Stage.GROWING, Stage.MATURE];
    if (!fusableStages.includes(parentA.stage as Stage)) {
      throw new BadRequestException(
        `Parent A must be GROWING/MATURE (got ${parentA.stage})`,
      );
    }
    if (!fusableStages.includes(parentB.stage as Stage)) {
      throw new BadRequestException(
        `Parent B must be GROWING/MATURE (got ${parentB.stage})`,
      );
    }

    return { a: parentA, b: parentB };
  }

  // ========================
  // 2. 成功率计算
  // ========================

  private calculateSuccessRate(
    soil: SoilType,
    parentA: { stage: string },
    parentB: { stage: string },
  ): { successRate: number; isMaturePenalty: boolean } {
    let rate = 75; // 基础成功率
    let isMaturePenalty = false;

    // 土壤加成
    rate += SOIL_MODIFIERS[soil].successBonus;

    // MATURE 阶段惩罚：每株 MATURE -5%
    if (parentA.stage === Stage.MATURE) {
      rate -= 5;
      isMaturePenalty = true;
    }
    if (parentB.stage === Stage.MATURE) {
      rate -= 5;
      isMaturePenalty = true;
    }

    return { successRate: Math.max(rate, 5), isMaturePenalty };
  }

  // ========================
  // 3. 珍稀度抽取（加权随机）
  // ========================

  private rollRarity(): Rarity {
    const entries = Object.entries(RARITY_WEIGHTS) as [Rarity, number][];
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);

    let roll = Math.random() * totalWeight;
    for (const [rarity, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return rarity;
    }

    return Rarity.N; // fallback
  }

  // ========================
  // 4. 原子合并与去重
  // ========================

  private RARITY_SYSTEM_ATOMS: Record<Rarity, string[]> = {
    [Rarity.N]: [],
    [Rarity.R]: ['光泽1'],
    [Rarity.SR]: ['光泽1', '异色'],
    [Rarity.SSR]: ['光泽2', '异色', '荧光'],
    [Rarity.UR]: ['光泽3', '异色', '荧光', '虹彩', '传说'],
  };

  private mergeAtoms(
    atomsA: string[],
    atomsB: string[],
    rarity: Rarity,
  ): string[] {
    // 合并去重
    const merged = [...new Set([...atomsA, ...atomsB])];

    // 注入珍稀度系统词
    const systemAtoms = this.RARITY_SYSTEM_ATOMS[rarity] || [];
    for (const atom of systemAtoms) {
      if (!merged.includes(atom)) {
        merged.push(atom);
      }
    }

    return merged;
  }

  // ========================
  // 5. 首次奖励判定
  // ========================

  private async checkFirstTime(
    userId: string,
    parentAId: string,
    parentBId: string,
    rarity: Rarity,
  ): Promise<boolean> {
    // 查 FusionLog 是否存在同 userId + 同 parentA/B 组合（顺序无关）+ 同 rarity + success
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
  // 6. 失败处理
  // ========================

  private async handleFailure(
    userId: string,
    parentA: { id: string; stage: string; name: string | null },
    parentB: { id: string; stage: string; name: string | null },
    soil: SoilType,
    roll: number,
    successRate: number,
  ): Promise<FusionResponseDto> {
    // 大失败判定：roll 小于基础失败范围的 30% 时触发
    // 即失败范围是 (successRate ~ 100)，其中前 30% 是大失败
    const failRange = 100 - successRate;
    const graveThreshold = successRate + failRange * 0.3;
    const isGrave = roll < graveThreshold;
    const failType = isGrave ? FailType.GRAVE : FailType.NORMAL;

    if (isGrave) {
      // 大失败：亲本 A → RECOVERING，24h 冷却
      await this.prisma.flower.update({
        where: { id: parentA.id },
        data: {
          stage: Stage.RECOVERING,
          consumedAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 冷却到期时间 (Phase 3 实现校验)
        },
      });
    }
    // 普通失败：亲本保留，不做修改

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

    return {
      success: false,
      failType,
      atoms: [],
    };
  }

  // ========================
  // 8. AI 图片生成 + Socket 推送
  // ========================

  private async generateAndPush(
    userId: string,
    flowerId: string,
    rarity: string,
    atoms: string[],
    gold: number,
    xp: number,
    isFirstTime: boolean,
  ) {
    try {
      // 调用 AI Gateway 生成图片
      const genResult = await this.aiGateway.generateImage({
        flowerId,
        userId,
        prompt: '',
        atoms,
        rarity,
        stage: 'BLOOMING',
        seed: Date.now(),
      });

      // 更新 Flower.imageUrl
      await this.prisma.flower.update({
        where: { id: flowerId },
        data: { imageUrl: genResult.imageUrl },
      });

      // Socket.io 推送
      this.fusionGateway.emitFusionComplete(userId, {
        flowerId,
        rarity,
        atoms,
        imageUrl: genResult.imageUrl,
        reward: { gold, xp },
        isFirstTime,
      });
    } catch (err: any) {
      // 图片生成失败不阻塞 fusion 结果，只记录日志
      console.error(`Image generation failed for flower ${flowerId}:`, err.message);

      // 推送不带图的结果
      this.fusionGateway.emitFusionComplete(userId, {
        flowerId,
        rarity,
        atoms,
        imageUrl: null,
        reward: { gold, xp },
        isFirstTime,
      });
    }
  }

  // ========================
  // 辅助：生成花名
  // ========================

  private generateName(
    nameA: string | null,
    nameB: string | null,
    rarity: Rarity,
  ): string {
    const partA = (nameA || '未知').replace('种子', '');
    const partB = (nameB || '未知').replace('种子', '');
    const rarityPrefix =
      { N: '', R: '稀有', SR: '珍稀', SSR: '极品', UR: '传说' }[rarity] || '';
    return `${rarityPrefix}${partA}×${partB}`;
  }
}
