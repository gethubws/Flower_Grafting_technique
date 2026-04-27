import { Module } from '@nestjs/common';
import { FusionService } from './fusion.service';
import { FusionController } from './fusion.controller';
import { UserModule } from '../user/user.module';
import { GardenModule } from '../garden/garden.module';

@Module({
  imports: [UserModule, GardenModule],
  controllers: [FusionController],
  providers: [FusionService],
  exports: [FusionService],
})
export class FusionModule {}
