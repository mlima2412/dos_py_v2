import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusPedidoCompra } from '../enums/status-pedido-compra.enum';

export class UpdateStatusPedidoCompraDto {
  @ApiProperty({
    description: 'Novo status do pedido de compra',
    example: StatusPedidoCompra.CONCLUSAO,
    enum: StatusPedidoCompra,
  })
  @IsEnum(StatusPedidoCompra)
  status: StatusPedidoCompra;
}