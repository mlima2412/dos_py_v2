import { Module } from '@nestjs/common';
import { ContasPagarService } from './contas-pagar.service';
import { ContasPagarController } from './contas-pagar.controller';
import { ContasPagarParcelasService } from './contas-pagar-parcelas.service';
import { ContasPagarParcelasController } from './contas-pagar-parcelas.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DespesaCacheModule } from '../despesa-cache/despesa-cache.module';

@Module({
  imports: [DespesaCacheModule],
  controllers: [ContasPagarController, ContasPagarParcelasController],
  providers: [ContasPagarService, ContasPagarParcelasService, PrismaService],
  exports: [ContasPagarService, ContasPagarParcelasService],
})
export class ContasPagarModule {}
