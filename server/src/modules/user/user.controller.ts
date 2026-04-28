import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard, JwtPayload } from '../../common/guards/jwt.guard';
import { UserProfileDto } from './dto/user-profile.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async getProfile(@Req() req: any): Promise<UserProfileDto> {
    const { sub } = req.user as JwtPayload;
    const user = await this.userService.findById(sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      gold: user.gold,
      diamond: user.diamond,
      xp: user.xp,
      level: user.level,
      title: user.title ?? undefined,
    };
  }
}
