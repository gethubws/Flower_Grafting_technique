import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { TransactionType } from '../../common/enums';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户仓库中所有花（含预计算售价）。
   * 支持按稀有度/类型筛选。
   */
  async list(userId: string, filters?: { rarity?: string; isShopSeed?: boolean }) {
    const where: any = {
      ownerId: userId,
      location: 'WAREHOUSE',
      consumedAt: null,
    };
    if (filters?.rarity) where.rarity = filters.rarity;
    if (filters?.isShopSeed !== undefined) where.isShopSeed = filters.isShopSeed;

    const flowers = await this.prisma.flower.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        rarity: true,
        isShopSeed: true,
        sellPrice: true,
        factorScore: true,
        imageUrl: true,
        atoms: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return flowers.map((f) => ({
      ...f,
      atomCount: Array.isArray(f.atoms) ? f.atoms.length : 0,
    }));
  }

  /**
   * 出售花朵：获得 sellPrice 金币，标记 consumedAt。
   */
  async sell(userId: string, flowerId: string) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });

    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }
    if (flower.location !== 'WAREHOUSE') {
      throw new BadRequestException('Flower is not in warehouse');
    }
    if (!flower.sellPrice) {
      throw new BadRequestException('Flower has no sell price');
    }

    const gold = flower.sellPrice;

    await this.prisma.$transaction(async (tx) => {
      await tx.flower.update({
        where: { id: flowerId },
        data: { consumedAt: new Date() },
      });

      await tx.user.update({
        where: { id: userId },
        data: { gold: { increment: gold } },
      });

      await tx.transactionLog.create({
        data: {
          userId,
          type: TransactionType.HARVEST_SELL,
          currency: 'GOLD',
          amount: gold,
          balance: 0,
          reason: `Sold ${flower.rarity} flower: ${flower.name}`,
          relatedId: flowerId,
        },
      });
    });

    return {
      flowerId,
      flowerName: flower.name,
      goldReceived: gold,
    };
  }

  /**
   * 指定为性状稳定工程母株（仅标记，实际认证在嫁接时判定）。
   * 花留仓库不消耗。
   */
  async designateStability(userId: string, flowerId: string) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });

    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Flower not found');
    }
    if (flower.location !== 'WAREHOUSE') {
      throw new BadRequestException('Flower must be in warehouse to designate as mother plant');
    }
    if (flower.stage !== 'BLOOMING') {
      throw new BadRequestException('Only BLOOMING flowers can be designated as mother plant');
    }
    // 融合花才能做母株（有 parentAId）
    if (!flower.parentAId) {
      throw new BadRequestException('Only fused flowers can be mother plants for stability breeding');
    }

    // 标记：不做额外 DB 操作，嫁接时传 stabilityTargetId 即可
    return {
      flowerId,
      flowerName: flower.name,
      rarity: flower.rarity,
      designated: true,
      hint: 'Use this flowerId as stabilityTargetId in fusion requests.',
    };
  }
}
