import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 注册：仅需 name，返回 JWT accessToken
   * Phase 1 不校验重复名（同名为不同游客）
   */
  async register(name: string) {
    const user = await this.userService.create(name);
    const payload = { sub: user.id, name: user.name };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        gold: user.gold,
        diamond: user.diamond,
        xp: user.xp,
        level: user.level,
      },
    };
  }

  /**
   * 登录：Phase 1 用 name 查找，如果没有就注册（游客模式）
   */
  async login(name: string) {
    let user = await this.userService.findByName(name);
    if (!user) {
      return this.register(name);
    }
    const payload = { sub: user.id, name: user.name };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        gold: user.gold,
        diamond: user.diamond,
        xp: user.xp,
        level: user.level,
      },
    };
  }
}
