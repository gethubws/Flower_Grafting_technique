import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { FoundationService } from './foundation.service';
import { ClaimSeedDto, ListShopDto, UnlistShopDto } from './dto/foundation.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('foundation')
@UseGuards(JwtGuard)
export class FoundationController {
  constructor(private readonly foundationService: FoundationService) {}

  /**
   * GET /api/foundation/status
   * 查看所有母株稳定化状态。
   */
  @Get('status')
  async getStatus(@Req() req: any) {
    return this.foundationService.getStatus(req.user.sub);
  }

  /**
   * POST /api/foundation/claim-seed
   * 从奠基种领取免费种子。
   */
  @Post('claim-seed')
  async claimSeed(@Req() req: any, @Body() dto: ClaimSeedDto) {
    return this.foundationService.claimSeed(req.user.sub, dto.flowerId);
  }

  /**
   * POST /api/foundation/list-shop
   * 将奠基种上架商店。
   */
  @Post('list-shop')
  async listShop(@Req() req: any, @Body() dto: ListShopDto) {
    return this.foundationService.listShop(req.user.sub, dto.flowerId, dto.price);
  }

  /**
   * POST /api/foundation/unlist-shop
   * 下架。
   */
  @Post('unlist-shop')
  async unlistShop(@Req() req: any, @Body() dto: UnlistShopDto) {
    return this.foundationService.unlistShop(req.user.sub, dto.seedId);
  }

  /**
   * GET /api/foundation/revenue
   * 查看销售收入。
   */
  @Get('revenue')
  async getRevenue(@Req() req: any) {
    return this.foundationService.getRevenue(req.user.sub);
  }
}
