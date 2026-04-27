import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建游客账户，同时初始化 6 个 GardenSlot
   */
  async create(name: string) {
    const user = await this.prisma.user.create({
      data: {
        name,
        gold: 500,
        diamond: 0,
        xp: 0,
        level: 1,
        gardenSlots: {
          create: Array.from({ length: 6 }, (_, i) => ({ position: i })),
        },
      },
    });
    return user;
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return this.prisma.user.findFirst({ where: { name } });
  }

  /**
   * 原子增减金币，写 TransactionLog
   * @returns 更新后的 gold 余额
   */
  async updateGold(
    userId: string,
    delta: number,
    reason: string,
    relatedId?: string,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { gold: { increment: delta } },
    });

    await this.prisma.transactionLog.create({
      data: {
        userId,
        type: delta > 0 ? 'SYSTEM' : 'BUY',
        currency: 'GOLD',
        amount: delta,
        balance: user.gold,
        reason,
        relatedId,
      },
    });

    return user.gold;
  }

  /**
   * 增加 XP（可能触发升级）
   */
  async addXp(userId: string, delta: number) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: delta } },
    });

    // 简单等级计算：每 100 XP 升一级
    const newLevel = Math.floor(user.xp / 100) + 1;
    if (newLevel > user.level) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    return { xp: user.xp, level: Math.max(newLevel, user.level) };
  }
}
