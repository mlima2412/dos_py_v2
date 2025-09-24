import { Module } from '@nestjs/common';
import { PedidoCompraItemService } from './pedido-compra-item.service';
import { PedidoCompraItemController } from './pedido-compra-item.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PedidoCompraItemController],
  providers: [PedidoCompraItemService],
  exports: [PedidoCompraItemService],
})
export class PedidoCompraItemModule {}
