import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';

export class PlantSeedDto {
  @IsUUID('4')
  flowerId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  position?: number;
}
