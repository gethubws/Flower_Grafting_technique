import { Module } from '@nestjs/common';
import { FusionService } from './fusion.service';
import { FusionController } from './fusion.controller';
import { FusionGateway } from './fusion.gateway';
import { UserModule } from '../user/user.module';
import { GardenModule } from '../garden/garden.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [UserModule, GardenModule, AiGatewayModule],
  controllers: [FusionController],
  providers: [FusionService, FusionGateway],
  exports: [FusionService],
})
export class FusionModule {}
