import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { Stage, getStageFromProgress } from '../../common/enums';

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
   * 种植：将 SEED 阶段的 Flower 放入指定槽位，stage → SEEDLING
   */
  async plant(userId: string, flowerId: string, position: number) {
    // 校验 Flower 存在且属于当前用户
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
