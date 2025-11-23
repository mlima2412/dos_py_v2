import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { RollupVendasCacheService } from './rollup-vendas-cache.service';
import { VendaRollupService } from './venda-rollup.service';
import { RollupVendasController } from './rollup.vendas-cache.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [RollupVendasCacheService, VendaRollupService],
  controllers: [RollupVendasController],
  exports: [VendaRollupService, RollupVendasCacheService],
})
export class VendaCacheModule {}
