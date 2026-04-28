import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { BuySeedDto } from './dto/buy-seed.dto';
import { JwtGuard, JwtPayload } from '../../common/guards/jwt.guard';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  /**
   * GET /api/shop/seeds?tab=system|player&sort=newest|sales|rarity
   */
  @Get('seeds')
  async getSeeds(
    @Query('tab') tab?: string,
    @Query('sort') sort?: string,
  ) {
    return this.shopService.getSeeds(tab, sort as any);
  }

  @Post('buy-seed')
  @UseGuards(JwtGuard)
  async buySeed(@Req() req: any, @Body() dto: BuySeedDto) {
    const { sub } = req.user as JwtPayload;
    return this.shopService.buySeed(sub, dto.seedId);
  }
}
