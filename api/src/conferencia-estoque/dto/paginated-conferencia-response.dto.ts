import { ApiProperty } from '@nestjs/swagger';
import { ConferenciaEstoqueResponseDto } from './conferencia-estoque-response.dto';

export class PaginatedConferenciaEstoqueResponseDto {
  @ApiProperty({
    description: 'Lista de conferências de estoque',
    type: [ConferenciaEstoqueResponseDto],
  })
  data: ConferenciaEstoqueResponseDto[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Limite de registros por página', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
