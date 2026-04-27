import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { Stage, getStageFromProgress, HARVEST_REWARDS, TransactionType } from '../../common/enums';

@Injectable()
export class GardenService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户花园（6 个槽位 + 已种植的花）
   */
  async getGarden(userId: string) {
    const slots = await this.prisma.gardenSlot.findMany({
      where: { userId },
      include: {
        flower: true,
      },
      orderBy: { position: 'asc' },
    });

    // 过滤掉已消耗的花（consumedAt 非空 = 已用于嫁接）
    for (const slot of slots) {
      if (slot.flower?.consumedAt) {
        slot.flower = null;
        // 注意：这里不在数据库层面清理 slot，留给 Fusion 事务处理
      }
    }

    // 确保始终返回 6 个槽位（即使某些槽位无记录）
    const result = Array.from({ length: 6 }, (_, i) => {
      const slot = slots.find((s) => s.position === i);
      return (
        slot || {
          id: null,
          userId,
          position: i,
          flowerId: null,
          flower: null,
        }
      );
    });

    return result;
  }

  /**
   * 手动种植：将 SEED 阶段的 Flower 放入指定槽位，stage → SEEDLING
   * position 必填 — 用户通过工具栏选择种子后点击花盆来种植
   */
  async plant(userId: string, flowerId: string, position: number) {
    // 校验槽位范围
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });
    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }
    if (flower.stage !== 'SEED') {
      throw new BadRequestException(
        `Flower must be in SEED stage, got ${flower.stage}`,
      );
    }

    if (position < 0 || position > 5) {
      throw new BadRequestException('Invalid slot position');
    }

    // 校验槽位存在且为空
    const existingSlot = await this.prisma.gardenSlot.findUnique({
      where: { userId_position: { userId, position } },
    });
    if (!existingSlot) {
      throw new NotFoundException('Garden slot not found');
    }
    if (existingSlot.flowerId) {
      throw new BadRequestException(`Slot ${position} is already occupied`);
    }

    // 原子操作：更新槽位绑定 + 推进 Flower 到 SEEDLING
    const [updatedFlower] = await this.prisma.$transaction([
      this.prisma.flower.update({
        where: { id: flowerId },
        data: { stage: 'SEEDLING', progress: 10 },
      }),
      this.prisma.gardenSlot.update({
        where: { userId_position: { userId, position } },
        data: { flowerId },
      }),
    ]);

    return {
      slot: position,
      flower: updatedFlower,
    };
  }

  /**
   * 获取用户所有未种植的 SEED 阶段花（种子库存）
   */
  async getSeedInventory(userId: string) {
    // 找出所有 SEED 阶段且不在任何 GardenSlot 中的花
    const allSeeds = await this.prisma.flower.findMany({
      where: { ownerId: userId, stage: 'SEED', consumedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    // 筛选掉已在槽位中的
    const slots = await this.prisma.gardenSlot.findMany({
      where: { userId, flowerId: { not: null } },
      select: { flowerId: true },
    });
    const plantedIds = new Set(slots.map((s) => s.flowerId!).filter(Boolean));

    const unplanted = allSeeds.filter((s) => !plantedIds.has(s.id));

    // 按名称分组（堆叠）
    const grouped: Record<string, { name: string; rarity: string; count: number; sampleId: string }> = {};
    for (const seed of unplanted) {
      const key = seed.name || '(未知)';
      if (!grouped[key]) {
        grouped[key] = { name: key, rarity: seed.rarity, count: 0, sampleId: seed.id };
      }
      grouped[key].count++;
    }

    return Object.values(grouped);
  }

  /**
   * 收获：BLOOMING 阶段花 → 奖励金币/经验 → 消耗花 + 释放槽位
   */
  async harvest(userId: string, flowerId: string) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });
    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }
    if (flower.stage !== 'BLOOMING') {
      throw new BadRequestException(
        `Flower must be in BLOOMING stage to harvest, got ${flower.stage}`,
      );
    }

    const reward =
      HARVEST_REWARDS[flower.rarity as keyof typeof HARVEST_REWARDS];

    // 事务标记 Flower 消耗 + 释放槽位
    await this.prisma.flower.update({
      where: { id: flowerId },
      data: { consumedAt: new Date() },
    });

    await this.prisma.gardenSlot.updateMany({
      where: { flowerId },
      data: { flowerId: null },
    });

    // 金币 + 经验
    await this.prisma.user.update({
      where: { id: userId },
      data: { gold: { increment: reward.gold }, xp: { increment: reward.xp } },
    });

    // 交易日志
    await this.prisma.transactionLog.create({
      data: {
        userId,
        type: 'HARVEST',
        currency: 'GOLD',
        amount: reward.gold,
        balance: 0,
        reason: `Harvest ${flower.rarity} flower: ${flower.name}`,
        relatedId: flowerId,
      },
    });

    return {
      flowerId,
      flowerName: flower.name,
      rarity: flower.rarity,
      reward,
    };
  }

  /**
   * 手动推进生长：progress += amount，按阈值自动切换 stage
   */
  async advanceGrowth(userId: string, flowerId: string, amount = 30) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });
    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }

    const fusableStages: Stage[] = [
      Stage.SEEDLING,
      Stage.GROWING,
      Stage.MATURE,
    ];
    if (!fusableStages.includes(flower.stage as Stage)) {
      throw new BadRequestException(
        `Cannot grow flower in ${flower.stage} stage. Must be SEEDLING/GROWING/MATURE.`,
      );
    }

    const newProgress = Math.min(flower.progress + amount, 100);
    const newStage = getStageFromProgress(newProgress);

    const updated = await this.prisma.flower.update({
      where: { id: flowerId },
      data: { progress: newProgress, stage: newStage },
    });

    return {
      flower: updated,
      progressDelta: amount,
      stageChanged: flower.stage !== newStage,
    };
  }
}
