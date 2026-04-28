import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import {
  Stage,
  getStageFromProgress,
  HARVEST_XP_REWARDS,
  RARITY_SELL_MULTIPLIER,
  TransactionType,
  Rarity,
} from '../../common/enums';

@Injectable()
export class GardenService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户花园（6 个槽位 + 已种植的花）
   */
  async getGarden(userId: string) {
    const slots = await this.prisma.gardenSlot.findMany({
      where: { userId },
      include: { flower: true },
      orderBy: { position: 'asc' },
    });

    for (const slot of slots) {
      if (slot.flower?.consumedAt) {
        slot.flower = null;
      }
    }

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
   * 手动种植
   */
  async plant(userId: string, flowerId: string, position: number) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });
    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }
    if (flower.stage !== 'SEED') {
      throw new BadRequestException(`Flower must be in SEED stage, got ${flower.stage}`);
    }
    if (position < 0 || position > 5) {
      throw new BadRequestException('Invalid slot position');
    }

    const existingSlot = await this.prisma.gardenSlot.findUnique({
      where: { userId_position: { userId, position } },
    });
    if (!existingSlot) {
      throw new NotFoundException('Garden slot not found');
    }
    if (existingSlot.flowerId) {
      throw new BadRequestException(`Slot ${position} is already occupied`);
    }

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

    return { slot: position, flower: updatedFlower };
  }

  /**
   * 种子库存
   */
  async getSeedInventory(userId: string) {
    const allSeeds = await this.prisma.flower.findMany({
      where: { ownerId: userId, stage: 'SEED', consumedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    const slots = await this.prisma.gardenSlot.findMany({
      where: { userId, flowerId: { not: null } },
      select: { flowerId: true },
    });
    const plantedIds = new Set(slots.map((s) => s.flowerId!).filter(Boolean));
    const unplanted = allSeeds.filter((s) => !plantedIds.has(s.id));

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
   * Phase 1.5 收获（仓库制）：
   * BLOOMING → 给 XP + 必掉种子 → 花移入 WAREHOUSE → 释放槽位
   * 不再直接给金币。
   */
  async harvest(userId: string, flowerId: string) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });
    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }
    if (flower.stage !== 'BLOOMING') {
      throw new BadRequestException(`Flower must be BLOOMING, got ${flower.stage}`);
    }

    const rarity = flower.rarity as Rarity;
    const xpReward = HARVEST_XP_REWARDS[rarity] || 15;

    return await this.prisma.$transaction(async (tx) => {
      // 1. 发放 XP
      await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: xpReward } },
      });

      // 2. 必掉种子（作为 SEED 阶段 Flower 存入库，供 inventory 查询）
      const droppedSeed = await tx.flower.create({
        data: {
          ownerId: userId,
          name: flower.name || `${rarity}花`,
          stage: 'SEED',
          progress: 0,
          rarity: flower.rarity,
          atoms: flower.atoms as any,
          factorScore: flower.factorScore,
          isShopSeed: false,
        },
      });

      // 3. 预计算售价（出售时用）
      let sellPrice = 0;
      if (flower.isShopSeed) {
        // 基础花：查找对应的系统种子原价 × 1.5
        // 原花的种子名如 "玫瑰"，对应系统种子名为 "玫瑰种子"
        const systemSeed = await tx.seed.findFirst({
          where: { seedType: 'SYSTEM', isActive: true },
        });
        // 尝试匹配名称
        const matchingSeed = await tx.seed.findFirst({
          where: {
            seedType: 'SYSTEM',
            isActive: true,
            name: { contains: flower.name || '' },
          },
        });
        sellPrice = Math.floor((matchingSeed?.priceGold || systemSeed?.priceGold || 100) * 1.5);
      } else {
        // 融合花: 稀有度乘区 × (亲本A售价 + 亲本B售价)
        const multiplier = RARITY_SELL_MULTIPLIER[rarity];
        const [parentA, parentB] = await Promise.all([
          flower.parentAId ? tx.flower.findUnique({ where: { id: flower.parentAId } }) : null,
          flower.parentBId ? tx.flower.findUnique({ where: { id: flower.parentBId } }) : null,
        ]);
        const baseA = parentA?.sellPrice ?? 100;
        const baseB = parentB?.sellPrice ?? 100;
        sellPrice = Math.floor(multiplier * (baseA + baseB));
      }

      // 4. 花移入仓库
      await tx.flower.update({
        where: { id: flowerId },
        data: {
          location: 'WAREHOUSE',
          sellPrice,
        },
      });

      // 5. 释放槽位
      await tx.gardenSlot.updateMany({
        where: { flowerId },
        data: { flowerId: null },
      });

      return {
        flowerId,
        flowerName: flower.name,
        rarity,
        xpReward,
        sellPrice,
        seedDropped: true,
      };
    });
  }

  /**
   * 手动推进生长
   */
  async advanceGrowth(userId: string, flowerId: string, amount = 30) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });
    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }

    const fusableStages: Stage[] = [Stage.SEEDLING, Stage.GROWING, Stage.MATURE];
    if (!fusableStages.includes(flower.stage as Stage)) {
      throw new BadRequestException(
        `Cannot grow flower in ${flower.stage} stage. Must be SEEDLING/GROWING/MATURE.`,
      );
    }

    const newProgress = Math.min(flower.progress + amount, 100);
    const newStage = getStageFromProgress(newProgress);

    // MATURE→BLOOMING：应用 SD 生成的盛放图
    let bloomingImageApplied = false;
    const updateData: any = { progress: newProgress, stage: newStage };
    if (newStage === 'BLOOMING' && flower.growthImageUrl && !flower.imageUrl) {
      updateData.imageUrl = flower.growthImageUrl;
      bloomingImageApplied = true;
    }

    const updated = await this.prisma.flower.update({
      where: { id: flowerId },
      data: updateData,
    });

    return {
      flower: updated,
      progressDelta: amount,
      stageChanged: flower.stage !== newStage,
      bloomingImageApplied,
    };
  }
}
