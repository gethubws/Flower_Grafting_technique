import { IsUUID } from 'class-validator';

export class SellFlowerDto {
  @IsUUID('4')
  flowerId: string;
}

export class KeepFlowerDto {
  @IsUUID('4')
  flowerId: string;
}

export class DesignateStabilityDto {
  @IsUUID('4')
  flowerId: string;
}
