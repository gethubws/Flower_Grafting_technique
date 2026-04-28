import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { SellFlowerDto, DesignateStabilityDto } from './dto/warehouse.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('warehouse')
@UseGuards(JwtGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  /**
   * GET /api/warehouse
   * 列出仓库中所有花朵。
   * 可选查询参数：rarity=N|R|SR|SSR|UR, isShopSeed=true|false
   */
  @Get()
  async list(
    @Req() req: any,
    @Query('rarity') rarity?: string,
    @Query('isShopSeed') isShopSeed?: string,
  ) {
    return this.warehouseService.list(req.user.sub, {
      rarity,
      isShopSeed: isShopSeed !== undefined ? isShopSeed === 'true' : undefined,
    });
  }

  /**
   * POST /api/warehouse/sell
   * 出售仓库中的花朵，获得金币。
   */
  @Post('sell')
  async sell(@Req() req: any, @Body() dto: SellFlowerDto) {
    return this.warehouseService.sell(req.user.sub, dto.flowerId);
  }

  /**
   * POST /api/warehouse/designate-stability
   * 指定一株花为性状稳定工程的母株。
   */
  @Post('designate-stability')
  async designateStability(@Req() req: any, @Body() dto: DesignateStabilityDto) {
    return this.warehouseService.designateStability(req.user.sub, dto.flowerId);
  }
}
