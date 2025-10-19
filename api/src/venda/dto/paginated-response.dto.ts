import { ApiProperty } from '@nestjs/swagger';
import { Venda } from '../entities/venda.entity';

export class PaginatedVendaResponseDto {
  @ApiProperty({ type: [Venda], description: 'Array de vendas' })
  data: Venda[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 10 })
  limit: number;
}
