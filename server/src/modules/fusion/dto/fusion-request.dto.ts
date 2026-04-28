import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { SoilType, RitualType } from '../../../common/enums';

export class FusionRequestDto {
  @IsUUID('4')
  parentAId: string;

  @IsUUID('4')
  parentBId: string;

  @IsEnum(SoilType)
  soil: SoilType;

  @IsOptional()
  @IsEnum(RitualType)
  ritual?: RitualType;

  /** Phase 1.5: 性状稳定工程的母株 ID */
  @IsOptional()
  @IsUUID('4')
  stabilityTargetId?: string;
}
