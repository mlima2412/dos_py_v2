import { ApiProperty } from '@nestjs/swagger';
import { MovimentoEstoqueResponseDto } from './movimento-estoque-response.dto';

export class PaginatedMovimentoEstoqueResponseDto {
  @ApiProperty({
    description: 'Lista de movimentos de estoque',
    type: [MovimentoEstoqueResponseDto],
  })
  data: MovimentoEstoqueResponseDto[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Limite de registros por página', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
