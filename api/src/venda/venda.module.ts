import { Module } from '@nestjs/common';
import { VendaService } from './venda.service';
import { VendaController } from './venda.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DespesasModule } from '../despesas/despesas.module';

@Module({
  imports: [PrismaModule, DespesasModule],
  controllers: [VendaController],
  providers: [VendaService],
})
export class VendaModule {}
