import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class GrowAdvanceDto {
  @IsUUID('4')
  flowerId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  amount?: number; // 默认 30
}
