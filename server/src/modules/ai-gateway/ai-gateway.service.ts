import { Injectable, Logger } from '@nestjs/common';

export interface ImageGenerationPayload {
  flowerId: string;
  userId: string;
  prompt: string;
  atoms: string[];
  rarity: string;
  stage: string;
  seed: number;
}

export interface ImageGenerationResult {
  success: boolean;
  flowerId: string;
  imageUrl: string;
  placeholder: boolean;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.AI_GATEWAY_URL || 'http://localhost:8000';
  }

  /**
   * Phase 1: 同步 HTTP 调 Python AI Gateway 生成图片并返回 URL
   * Phase 3+: 切换为 BullMQ 队列入队
   */
  async generateImage(
    payload: ImageGenerationPayload,
  ): Promise<ImageGenerationResult> {
    this.logger.log(
      `Generating image for flower ${payload.flowerId} (${payload.rarity})`,
    );

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flower_id: payload.flowerId,
        user_id: payload.userId,
        prompt: payload.prompt,
        atoms: payload.atoms,
        rarity: payload.rarity,
        stage: payload.stage,
        seed: payload.seed,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} ${errText}`);
    }

    const raw: any = await response.json();
    const result: ImageGenerationResult = {
      success: raw.success,
      flowerId: raw.flower_id,
      imageUrl: raw.image_url,
      placeholder: raw.placeholder,
    };
    this.logger.log(
      `Image generated: ${result.imageUrl} (placeholder: ${result.placeholder})`,
    );
    return result;
  }
}
