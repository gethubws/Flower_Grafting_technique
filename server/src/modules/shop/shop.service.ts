import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { TransactionType } from '../../common/enums';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取所有在售种子
   */
  async getSeeds() {
    return this.prisma.seed.findMany({
      where: { isActive: true },
      orderBy: { priceGold: 'asc' },
    });
  }

  /**
   * 购买种子：扣金币，生成 Flower(stage=SEED, isShopSeed=true)
   */
  async buySeed(userId: string, seedId: string) {
    const seed = await this.prisma.seed.findUnique({
      where: { id: seedId },
    });
    if (!seed || !seed.isActive) {
      throw new NotFoundException('Seed not found');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.gold < seed.priceGold) {
      throw new BadRequestException(
        `Insufficient gold: need ${seed.priceGold}, have ${user.gold}`,
      );
    }

    // 原子扣款 + 写流水
    await this.userService.updateGold(
      userId,
      -seed.priceGold,
      `Buy seed: ${seed.name}`,
      seedId,
    );

    // 创建 SEED 阶段的 Flower
    const flower = await this.prisma.flower.create({
      data: {
        ownerId: userId,
        name: `${seed.name}种子`,
        stage: 'SEED',
        progress: 0,
        rarity: 'N', // 基础花默认 N
        atoms: seed.atomLibrary as any,
        isShopSeed: true,
      },
    });

    return {
      flower,
      cost: seed.priceGold,
      remainingGold: user.gold - seed.priceGold,
    };
  }
}
