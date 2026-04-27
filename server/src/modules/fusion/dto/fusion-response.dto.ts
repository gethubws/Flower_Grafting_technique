import { FusionRewardDto } from './fusion-reward.dto';

export class FusionResponseDto {
  success: boolean;
  flowerId?: string;
  rarity?: string;
  atoms?: string[];
  reward?: FusionRewardDto;
  isFirstTime?: boolean;
  failType?: string;
  imageUrl?: string;
}
