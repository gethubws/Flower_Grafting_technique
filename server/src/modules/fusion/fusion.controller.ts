import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { FusionService } from './fusion.service';
import { FusionRequestDto } from './dto/fusion-request.dto';
import { JwtGuard, JwtPayload } from '../../common/guards/jwt.guard';

@Controller('fusion')
export class FusionController {
  constructor(private readonly fusionService: FusionService) {}

  @Post()
  @UseGuards(JwtGuard)
  async fuse(@Req() req: any, @Body() dto: FusionRequestDto) {
    const { sub } = req.user as JwtPayload;
    return this.fusionService.executeFusion(sub, dto);
  }
}
