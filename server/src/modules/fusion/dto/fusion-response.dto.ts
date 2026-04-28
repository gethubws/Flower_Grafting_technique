import { FusionRewardDto } from './fusion-reward.dto';

export class FusionResponseDto {
  success: boolean;
  flowerId?: string;
  rarity?: string;
  atoms?: any[];                 // [{ id, category, level, prompt_chinese }]
  factorScore?: number;          // Phase 1.5: 因子总积分
  inheritedCount?: number;       // Phase 1.5: 继承的因子数
  droppedCount?: number;         // Phase 1.5: 丢失的因子数
  appliedRules?: string[];       // Phase 1.5: 触发的融合规则名
  doubleCount?: number;          // Phase 1.5: 多倍体计数
  stabilityResult?: {            // Phase 1.5: 性状稳定结果
    similar: boolean;
    reason?: string;
    diff?: number;
    progress?: number;
    becameFoundation?: boolean;
  } | null;
  reward?: FusionRewardDto;
  isFirstTime?: boolean;
  failType?: string;
  imageUrl?: string;
}
