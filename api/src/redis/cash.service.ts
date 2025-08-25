// src/redis/cache.service.ts
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  async get<T = any>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set(key: string, value: any, ttlSec = 180): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  }

  async del(key: string | string[]) {
    return Array.isArray(key) ? this.redis.del(...key) : this.redis.del(key);
  }

  // helper: “cache-aside” (busca do DB e salva)
  async wrap<T>(
    key: string,
    ttlSec: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const hit = await this.get<T>(key);
    if (hit) return hit;
    const data = await loader();
    await this.set(key, data, ttlSec);
    return data;
  }
}
