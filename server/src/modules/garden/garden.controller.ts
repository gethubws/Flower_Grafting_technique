import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { GardenService } from './garden.service';
import { PlantSeedDto } from './dto/plant-seed.dto';
import { GrowAdvanceDto } from './dto/grow-advance.dto';
import { JwtGuard, JwtPayload } from '../../common/guards/jwt.guard';

@Controller('garden')
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getGarden(@Req() req: any) {
    const { sub } = req.user as JwtPayload;
    return this.gardenService.getGarden(sub);
  }

  @Post('plant')
  @UseGuards(JwtGuard)
  async plant(@Req() req: any, @Body() dto: PlantSeedDto) {
    const { sub } = req.user as JwtPayload;
    return this.gardenService.plant(sub, dto.flowerId, dto.position);
  }

  @Post('grow')
  @UseGuards(JwtGuard)
  async grow(@Req() req: any, @Body() dto: GrowAdvanceDto) {
    const { sub } = req.user as JwtPayload;
    return this.gardenService.advanceGrowth(
      sub,
      dto.flowerId,
      dto.amount ?? 30,
    );
  }
}
