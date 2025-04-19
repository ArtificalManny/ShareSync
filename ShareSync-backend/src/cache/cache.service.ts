import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class CacheService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379',
    });
    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.connect();
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.client.set(key, value, { EX: ttl });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}