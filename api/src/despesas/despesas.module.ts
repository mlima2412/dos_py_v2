import { Module } from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { DespesasController } from './despesas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DespesaCacheModule } from '../despesa-cache/despesa-cache.module';

@Module({
  imports: [PrismaModule, DespesaCacheModule],
  controllers: [DespesasController],
  providers: [DespesasService],
  exports: [DespesasService],
})
export class DespesasModule {}