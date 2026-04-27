import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface JwtPayload {
  sub: string; // userId
  name: string;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.slice(7);
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

/**
 * 可选认证 Guard：有 token 就解析，没有也不报错（用于公共接口兼容）
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(
          authHeader.slice(7),
        );
        (request as any).user = payload;
      } catch {
        // ignore invalid token for optional guard
      }
    }
    return true;
  }
}
