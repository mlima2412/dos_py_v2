import { ApiProperty } from '@nestjs/swagger';
import { PedidoCompra } from '../entities/pedido-compra.entity';

export class PaginatedPedidoCompraResponseDto {
  @ApiProperty({
    description: 'Lista de pedidos de compra',
    type: [PedidoCompra],
  })
  data: PedidoCompra[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Limite de registros por página', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
