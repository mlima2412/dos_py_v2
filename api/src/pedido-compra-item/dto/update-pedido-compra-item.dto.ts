import { PartialType } from '@nestjs/swagger';
import { CreatePedidoCompraItemDto } from './create-pedido-compra-item.dto';

export class UpdatePedidoCompraItemDto extends PartialType(CreatePedidoCompraItemDto) {}
