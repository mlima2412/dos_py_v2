import { Module } from '@nestjs/common';
import { PedidoCompraService } from './pedido-compra.service';
import { PedidoCompraController } from './pedido-compra.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DespesasModule } from '../despesas/despesas.module';

@Module({
  imports: [PrismaModule, DespesasModule],
  controllers: [PedidoCompraController],
  providers: [PedidoCompraService],
  exports: [PedidoCompraService],
})
export class PedidoCompraModule {}
