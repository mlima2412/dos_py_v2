import { Module } from '@nestjs/common';
import { PedidoCompraService } from './pedido-compra.service';
import { PedidoCompraController } from './pedido-compra.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PedidoCompraController],
  providers: [PedidoCompraService],
  exports: [PedidoCompraService],
})
export class PedidoCompraModule {}
