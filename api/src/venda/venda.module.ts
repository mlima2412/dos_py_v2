import { Module } from '@nestjs/common';
import { VendaService } from './venda.service';
import { VendaController } from './venda.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DespesasModule } from '../despesas/despesas.module';
import { VendaCacheModule } from '../cash/vendas/venda-cache.module';
import { LancamentoDreModule } from '../lancamento-dre/lancamento-dre.module';

@Module({
  imports: [PrismaModule, DespesasModule, VendaCacheModule, LancamentoDreModule],
  controllers: [VendaController],
  providers: [VendaService],
})
export class VendaModule {}
