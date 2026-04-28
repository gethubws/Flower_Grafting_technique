import { IsUUID, IsInt, Min } from 'class-validator';

export class ClaimSeedDto {
  @IsUUID('4')
  flowerId: string;
}

export class ListShopDto {
  @IsUUID('4')
  flowerId: string;

  @IsInt()
  @Min(1)
  price: number;
}

export class UnlistShopDto {
  @IsUUID('4')
  seedId: string;
}
