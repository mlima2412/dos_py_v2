import { ApiProperty } from '@nestjs/swagger';
import { Produto } from '../entities/produto.entity';

export class PaginatedProdutoResponseDto {
  @ApiProperty({
    description: 'Lista de produtos',
    type: [Produto],
  })
  data: Produto[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Limite de registros por página', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
