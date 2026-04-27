import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './config/prisma/prisma.module';
import { RedisModule } from './config/redis/redis.module';
import { MinioModule } from './config/minio/minio.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    // 全局配置（读取 .env）
    ConfigModule.forRoot({ isGlobal: true }),

    // 全局 JWT 模块（User/Auth 等模块共用）
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'flowerlang_jwt_secret_key_2026',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION || '7d',
      },
    }),

    // 基础设施
    PrismaModule,
    RedisModule,
    MinioModule,

    // 业务模块
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局 ValidationPipe
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
        }),
    },
  ],
})
export class AppModule {}
