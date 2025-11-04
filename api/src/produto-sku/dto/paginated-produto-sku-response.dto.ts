import { ApiProperty } from '@nestjs/swagger';
import { ProdutoSKU } from '../entities/produto-sku.entity';

export class PaginatedProdutoSkuResponseDto {
  @ApiProperty({
    description: 'Lista de SKUs',
    type: [ProdutoSKU],
  })
  data: ProdutoSKU[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Limite de registros por página', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
