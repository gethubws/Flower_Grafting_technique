import { IsUUID } from 'class-validator';

export class BuySeedDto {
  @IsUUID('4')
  seedId: string;
}
