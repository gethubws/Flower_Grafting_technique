import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { TransactionType } from '../../common/enums';

/**
 * 每日结算服务：统计玩家商店种子的销量，按 80% 分发给卖家。
 * Phase 1.5: 每 24 小时执行一次（简化实现：服务启动时注册定时器）。
 */
@Injectable()
export class ShopSettlementService implements OnModuleInit {
  private readonly logger = new Logger(ShopSettlementService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // 每 24 小时结算一次
    const INTERVAL = 24 * 60 * 60 * 1000;
    setInterval(() => this.settle(), INTERVAL);
    this.logger.log(`Daily settlement scheduled every ${INTERVAL / 3600000}h`);
  }

  async settle() {
    this.logger.log('Starting daily settlement...');

    const playerSeeds = await this.prisma.seed.findMany({
      where: {
        isFoundationSeed: true,
        isActive: true,
        totalSold: { gt: 0 },
      },
    });

    let totalPaid = 0;
    let sellersPaid = 0;

    for (const seed of playerSeeds) {
      if (!seed.sellerId || !seed.totalSold || !seed.customPrice) continue;

      const gross = seed.totalSold * seed.customPrice;
      const share = Math.floor(gross * (seed.revenueShare || 0.8));

      if (share > 0) {
        await this.prisma.user.update({
          where: { id: seed.sellerId },
          data: { gold: { increment: share } },
        });

        await this.prisma.transactionLog.create({
          data: {
            userId: seed.sellerId,
            type: TransactionType.REVENUE_SHARE,
            currency: 'GOLD',
            amount: share,
            balance: 0,
            reason: `Shop revenue: ${seed.name} (${seed.totalSold} sold × ${seed.customPrice}g × 80%)`,
            relatedId: seed.id,
          },
        });

        totalPaid += share;
        sellersPaid++;
      }

      // 重置日销量
      await this.prisma.seed.update({
        where: { id: seed.id },
        data: { totalSold: 0 },
      });
    }

    this.logger.log(
      `Settlement complete: ${sellersPaid} sellers paid, ${totalPaid}g total`,
    );
    return { sellersPaid, totalPaid };
  }
}
