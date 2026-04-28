import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { ShopSettlementService } from './shop-settlement.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [ShopController],
  providers: [ShopService, ShopSettlementService],
  exports: [ShopService],
})
export class ShopModule {}
