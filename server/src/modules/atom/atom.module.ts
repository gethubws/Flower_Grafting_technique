import { Module, Global } from '@nestjs/common';
import { AtomLoaderService } from './atom-loader.service';
import { AtomInheritanceService } from './atom-inheritance.service';
import { AtomFusionRuleService } from './atom-fusion-rule.service';
import { AtomScoreService } from './atom-score.service';

@Global()
@Module({
  providers: [
    AtomLoaderService,
    AtomInheritanceService,
    AtomFusionRuleService,
    AtomScoreService,
  ],
  exports: [
    AtomLoaderService,
    AtomInheritanceService,
    AtomFusionRuleService,
    AtomScoreService,
  ],
})
export class AtomModule {}
