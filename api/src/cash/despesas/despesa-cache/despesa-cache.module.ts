import { Module } from '@nestjs/common';
import { DespesaCacheService } from './despesa-cache.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RedisModule } from '../../../redis/redis.module';
import { RollupDespesasCacheService } from './rollup-despesas-cache.service';
import { RollupController } from './rollup.despesa-cache.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [DespesaCacheService, RollupDespesasCacheService],
  controllers: [RollupController],
  exports: [DespesaCacheService, RollupDespesasCacheService],
})
export class DespesaCacheModule {}
