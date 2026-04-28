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
import { ShopModule } from './modules/shop/shop.module';
import { GardenModule } from './modules/garden/garden.module';
import { FusionModule } from './modules/fusion/fusion.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { AtomModule } from './modules/atom/atom.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { FoundationModule } from './modules/foundation/foundation.module';
import { DebugModule } from './modules/debug/debug.module';

// 构建 imports 数组，DEBUG_MODE 时加载调试模块
const imports: any[] = [
  ConfigModule.forRoot({ isGlobal: true }),

  JwtModule.register({
    global: true,
    secret: process.env.JWT_SECRET || 'flowerlang_jwt_secret_key_2026',
    signOptions: {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
    },
  }),

  PrismaModule,
  RedisModule,
  MinioModule,

  AtomModule,

  UserModule,
  ShopModule,
  GardenModule,
  FusionModule,
  AiGatewayModule,
  WarehouseModule,
  FoundationModule,
];

if (process.env.DEBUG_MODE === 'true') {
  imports.push(DebugModule);
  console.log('🛠️  DEBUG MODE enabled');
}

@Module({
  imports,
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
