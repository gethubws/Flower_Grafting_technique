import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface FusionCompletePayload {
  flowerId: string;
  rarity: string;
  atoms: string[];
  imageUrl: string | null;
  reward: { gold: number; xp: number };
  isFirstTime: boolean;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/fusion',
})
export class FusionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FusionGateway.name);

  handleConnection(client: Socket) {
    // Phase 1 简版：通过 handshake query 传 userId
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} joined room user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * 推送嫁接完成事件到指定用户
   */
  emitFusionComplete(userId: string, payload: FusionCompletePayload) {
    this.server.to(`user:${userId}`).emit('fusion:complete', payload);
    this.logger.log(
      `Emitted fusion:complete to user:${userId} — flower=${payload.flowerId}`,
    );
  }

  /**
   * Phase 1 预留：全服广播（仅 UR 触发）
   */
  serverBroadcast(event: string, message: string) {
    this.server.emit(event, { message });
    this.logger.log(`Broadcast: ${event}`);
  }
}
