import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheService } from './cash.service';

@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => {
        const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
        const client = new Redis(url, {
          retryStrategy: times => Math.min(times * 200, 2000),
        });
        client.on('connect', () => console.log('[Redis] connected'));
        client.on('error', e => console.error('[Redis] error', e.message));
        return client;
      },
    },
    CacheService,
  ],
  exports: ['REDIS', CacheService],
})
export class RedisModule {}
