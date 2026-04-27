import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { BuySeedDto } from './dto/buy-seed.dto';
import { JwtGuard, JwtPayload } from '../../common/guards/jwt.guard';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('seeds')
  async getSeeds() {
    return this.shopService.getSeeds();
  }

  @Post('buy-seed')
  @UseGuards(JwtGuard)
  async buySeed(@Req() req: any, @Body() dto: BuySeedDto) {
    const { sub } = req.user as JwtPayload;
    return this.shopService.buySeed(sub, dto.seedId);
  }
}
