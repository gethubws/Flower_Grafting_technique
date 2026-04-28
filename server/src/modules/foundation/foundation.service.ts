import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class FoundationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户所有母株的稳定化状态。
   * 包括：仓库中可作母株的花 + 已认证奠基种。
   */
  async getStatus(userId: string) {
    // 查询所有仓库中的融合花（有 parentAId = 可作母株）
    const candidates = await this.prisma.flower.findMany({
      where: {
        ownerId: userId,
        location: 'WAREHOUSE',
        consumedAt: null,
        parentAId: { not: null },
      },
      orderBy: { stabilityProgress: 'desc' },
      select: {
        id: true,
        name: true,
        rarity: true,
        isFoundation: true,
        stabilityProgress: true,
        factorScore: true,
        imageUrl: true,
        atoms: true,
        createdAt: true,
      },
    });

    return candidates.map((f) => ({
      ...f,
      atomCount: Array.isArray(f.atoms) ? f.atoms.length : 0,
      remaining: Math.max(0, 10 - f.stabilityProgress),
      isComplete: f.isFoundation || f.stabilityProgress >= 10,
    }));
  }

  /**
   * 从奠基种领取免费种子。
   * 奠基种可无限领取，每次创建一株 SEED 阶段的花。
   */
  async claimSeed(userId: string, flowerId: string) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });

    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Foundation flower not found');
    }
    if (!flower.isFoundation) {
      throw new BadRequestException('This flower is not a foundation seed. Complete stability breeding first.');
    }
    if (flower.consumedAt) {
      throw new BadRequestException('Foundation flower has been consumed');
    }

    // 创建一份种子（SEED 阶段花）
    const seed = await this.prisma.flower.create({
      data: {
        ownerId: userId,
        name: flower.name || `${flower.rarity}奠基种`,
        rarity: flower.rarity,
        atoms: flower.atoms as any,
        factorScore: flower.factorScore,
        stage: 'SEED',
        progress: 0,
        isShopSeed: false,
        parentAId: flower.parentAId, // 保留谱系
        parentBId: flower.parentBId,
        growthImageSeed: flower.growthImageSeed,
      },
    });

    return {
      seedId: seed.id,
      name: seed.name,
      rarity: seed.rarity,
      atomCount: Array.isArray(seed.atoms) ? seed.atoms.length : 0,
    };
  }

  /**
   * 将奠基种上架至玩家商店。
   */
  async listShop(userId: string, flowerId: string, price: number) {
    const flower = await this.prisma.flower.findUnique({
      where: { id: flowerId },
    });

    if (!flower || flower.ownerId !== userId) {
      throw new NotFoundException('Foundation flower not found');
    }
    if (!flower.isFoundation) {
      throw new BadRequestException('Only foundation seeds can be listed in shop');
    }

    // 检查是否已上架
    const existing = await this.prisma.seed.findFirst({
      where: { foundationFlowerId: flowerId, isFoundationSeed: true },
    });
    if (existing) {
      throw new BadRequestException('This foundation seed is already listed');
    }

    const shopSeed = await this.prisma.seed.create({
      data: {
        name: flower.foundationName || flower.name || `${flower.rarity}奠基种`,
        description: `育种家「${flower.ownerId}」培育的${flower.rarity}级奠基种。`,
        emoji: '🧬',
        priceGold: price,
        atomLibrary: flower.atoms as any,
        isActive: true,
        isFoundationSeed: true,
        foundationFlowerId: flowerId,
        sellerId: userId,
        customPrice: price,
        revenueShare: 0.8,
        seedType: 'FOUNDATION',
        parentFlowerId: flowerId,
        growTime: 0,
      },
    });

    return {
      seedId: shopSeed.id,
      name: shopSeed.name,
      price,
      sellerId: userId,
    };
  }

  /**
   * 下架玩家商店中的奠基种。
   */
  async unlistShop(userId: string, seedId: string) {
    const seed = await this.prisma.seed.findUnique({
      where: { id: seedId },
    });

    if (!seed || seed.sellerId !== userId) {
      throw new NotFoundException('Shop listing not found');
    }

    await this.prisma.seed.delete({ where: { id: seedId } });

    return { seedId, unlisted: true };
  }

  /**
   * 查看奠基种销售收入。
   */
  async getRevenue(userId: string) {
    const listings = await this.prisma.seed.findMany({
      where: { sellerId: userId, isFoundationSeed: true },
      select: {
        id: true,
        name: true,
        totalSold: true,
        customPrice: true,
        revenueShare: true,
      },
    });

    const totalRevenue = listings.reduce((sum, l) => {
      const sold = l.totalSold || 0;
      const price = l.customPrice || 0;
      const share = l.revenueShare || 0.8;
      return sum + Math.floor(sold * price * share);
    }, 0);

    return {
      listings,
      totalRevenue,
      pendingSettlement: totalRevenue, // Phase 1.5 简化：即时显示预估收入
    };
  }
}
