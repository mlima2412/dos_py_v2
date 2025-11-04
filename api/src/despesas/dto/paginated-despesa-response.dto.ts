import { ApiProperty } from '@nestjs/swagger';
import { Despesa } from '../entities/despesa.entity';

export class PaginatedDespesaResponseDto {
  @ApiProperty({
    description: 'Lista de despesas',
    type: [Despesa],
  })
  data: Despesa[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Limite de registros por página', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
