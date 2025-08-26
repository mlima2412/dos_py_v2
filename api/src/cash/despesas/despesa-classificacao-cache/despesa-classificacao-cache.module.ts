import { Module } from '@nestjs/common';
import { RollupDespesasClassificacaoCacheService } from './rollup-despesas-classificacao-cache.service';
import { RollupClassificacaoController } from './rollup.despesa-classificacao-cache.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RedisModule } from '../../../redis/redis.module';
import { DespesaClassificacaoCacheService } from './despesa-classiificacao-cache.service';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    DespesaClassificacaoCacheService,
    RollupDespesasClassificacaoCacheService,
  ],
  controllers: [RollupClassificacaoController],
  exports: [DespesaClassificacaoCacheService],
})
export class DespesaClassificacaoCacheModule {}
