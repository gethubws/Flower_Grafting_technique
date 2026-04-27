import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private client: Minio.Client;
  private bucket: string;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'flowerlang',
      secretKey: process.env.MINIO_SECRET_KEY || 'flowerlang123',
    });
    this.bucket = process.env.MINIO_BUCKET || 'flowers';
  }

  async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      console.log(`📦 MinIO bucket "${this.bucket}" created`);
    }
  }

  async uploadBuffer(
    objectName: string,
    buffer: Buffer,
    contentType = 'image/png',
  ): Promise<string> {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, objectName, buffer, undefined, {
      'Content-Type': contentType,
    });
    return this.getUrl(objectName);
  }

  getUrl(objectName: string): string {
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }
}
