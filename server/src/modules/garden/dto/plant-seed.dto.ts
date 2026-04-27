import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class PlantSeedDto {
  @IsUUID('4')
  flowerId: string;

  @IsInt()
  @Min(0)
  @Max(5)
  position: number;
}
