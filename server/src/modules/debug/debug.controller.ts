import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { DebugService } from './debug.service';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('debug')
@UseGuards(JwtGuard)
export class DebugController {
  constructor(private readonly debugService: DebugService) {}

  @Post('set-rarity')
  async setRarity(@Body() body: { flowerId: string; rarity: string }) {
    return this.debugService.setRarity(body.flowerId, body.rarity);
  }

  @Post('set-stage')
  async setStage(@Body() body: { flowerId: string; stage: string; progress: number }) {
    return this.debugService.setStage(body.flowerId, body.stage, body.progress);
  }

  @Post('boost-stability')
  async boostStability(@Body() body: { flowerId: string; count: number }) {
    return this.debugService.boostStability(body.flowerId, body.count || 10);
  }

  @Post('spawn-flower')
  async spawnFlower(@Req() req: any, @Body() body: { atomIds: string[]; rarity: string; stage: string }) {
    return this.debugService.spawnFlower(req.user.sub, body.atomIds, body.rarity, body.stage);
  }

  @Post('simulate-stabilization')
  async simulateStabilization(@Req() req: any, @Body() body: { rarity: string; atomIds: string[] }) {
    return this.debugService.simulateStabilization(req.user.sub, body.rarity, body.atomIds);
  }

  @Get('atoms')
  async getAtoms() {
    return this.debugService.getAtoms();
  }

  @Get('fusion-rules')
  async getFusionRules() {
    return this.debugService.getFusionRules();
  }

  @Get('probability-table')
  async getProbabilityTable() {
    return this.debugService.getProbabilityTable();
  }

  @Get('adjective-pools')
  async getAdjectivePools() {
    return this.debugService.getAdjectivePools();
  }
}
