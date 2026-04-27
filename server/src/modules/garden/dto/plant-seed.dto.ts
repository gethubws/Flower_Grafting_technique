import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class PlantSeedDto {
  @IsUUID('4')
  flowerId: string; // 要种植的 Flower（必须处于 SEED 阶段）

  @IsInt()
  @Min(0)
  @Max(5)
  position: number; // 槽位 0~5
}
