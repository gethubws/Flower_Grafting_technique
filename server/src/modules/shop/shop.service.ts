import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { TransactionType } from '../../common/enums';

export type ShopSort = 'newest' | 'sales' | 'rarity';

const RARITY_ORDER: Record<string, number> = {
  UR: 0, SSR: 1, SR: 2, R: 3, N: 4,
};

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取所有商店种子（系统 + 玩家）。
   */
  async getSeeds(tab?: string, sort?: ShopSort) {
    const [system, player] = await Promise.all([
      this.getSystemSeeds(),
      this.getPlayerSeeds(sort),
    ]);

    if (tab === 'system') return { system, player: [] };
    if (tab === 'player') return { system: [], player };
    return { system, player };
  }

  /**
   * 系统种子。
   */
  private async getSystemSeeds() {
    return this.prisma.seed.findMany({
      where: { isActive: true, isFoundationSeed: false },
      orderBy: { priceGold: 'asc' },
    });
  }

  /**
   * 玩家商店（奠基种）。
   */
  private async getPlayerSeeds(sort?: ShopSort) {
    let orderBy: any = { createdAt: 'desc' }; // newest

    if (sort === 'sales') {
      orderBy = { totalSold: 'desc' };
    } else if (sort === 'rarity') {
      // Prisma 不支持 custom order by computed field，在应用层排序
      orderBy = { createdAt: 'desc' };
    }

    let seeds = await this.prisma.seed.findMany({
      where: { isActive: true, isFoundationSeed: true },
      orderBy,
    });

    // 稀有度排序：在应用层按 RARITY_ORDER 排序
    if (sort === 'rarity') {
      seeds.sort((a, b) => {
        const ra = RARITY_ORDER[(a.atomLibrary as any)?.rarity] ?? 99;
        const rb = RARITY_ORDER[(b.atomLibrary as any)?.rarity] ?? 99;
        return ra - rb;
      });
    }

    return seeds.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      emoji: s.emoji,
      priceGold: s.customPrice || s.priceGold,
      sellerId: s.sellerId,
      totalSold: s.totalSold,
      revenueShare: s.revenueShare,
      atomCount: Array.isArray(s.atomLibrary) ? s.atomLibrary.length : 0,
      createdAt: s.createdAt,
    }));
  }

  /**
   * 购买种子：系统种子或玩家种子。
   */
  async buySeed(userId: string, seedId: string, isPlayerSeed?: boolean) {
    const seed = await this.prisma.seed.findUnique({
      where: { id: seedId },
    });
    if (!seed || !seed.isActive) {
      throw new NotFoundException('Seed not found');
    }

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const price = seed.isFoundationSeed ? (seed.customPrice || seed.priceGold) : seed.priceGold;
    if (user.gold < price) {
      throw new BadRequestException(`Insufficient gold: need ${price}, have ${user.gold}`);
    }

    // 扣款
    await this.userService.updateGold(userId, -price, `Buy seed: ${seed.name}`, seedId);

    // 玩家种子：更新销量
    if (seed.isFoundationSeed && seed.sellerId) {
      await this.prisma.seed.update({
        where: { id: seedId },
        data: { totalSold: { increment: 1 } },
      });
    }

    // 创建 SEED Flower（继承奠基种的因子）
    const flower = await this.prisma.flower.create({
      data: {
        ownerId: userId,
        name: `${seed.name}`,
        stage: 'SEED',
        progress: 0,
        rarity: 'N',
        atoms: seed.atomLibrary as any,
        isShopSeed: !seed.isFoundationSeed,
        factorScore: 0,
        // 奠基种：携带自身基础因子+稀有度由后续决定
        ...(seed.isFoundationSeed ? {} : {}),
      },
    });

    // 如果奠基种买了，把原花的部分属性复制过来
    if (seed.isFoundationSeed && seed.foundationFlowerId) {
      const foundationFlower = await this.prisma.flower.findUnique({
        where: { id: seed.foundationFlowerId },
      });
      if (foundationFlower) {
        await this.prisma.flower.update({
          where: { id: flower.id },
          data: {
            rarity: foundationFlower.rarity,
            factorScore: foundationFlower.factorScore,
            growthImageSeed: foundationFlower.growthImageSeed || foundationFlower.name,
          },
        });
      }
    }

    return {
      flower,
      cost: price,
      remainingGold: user.gold - price,
    };
  }
}
