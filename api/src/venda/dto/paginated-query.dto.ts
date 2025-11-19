import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginatedQueryDto {
  @ApiProperty({ description: 'Página atual', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @ApiProperty({ description: 'Status opcional para filtro', required: false })
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Tipo de filtro predefinido baseado no menu',
    required: false,
    enum: ['pedido', 'venda', 'condicional', 'brindePermuta'],
  })
  @IsOptional()
  @IsIn(['pedido', 'venda', 'condicional', 'brindePermuta'])
  filterType?: 'pedido' | 'venda' | 'condicional' | 'brindePermuta';

  @ApiProperty({
    description: 'Tipo de venda para filtro adicional',
    required: false,
    enum: ['DIRETA', 'CONDICIONAL', 'BRINDE', 'PERMUTA'],
  })
  @IsOptional()
  @IsIn(['DIRETA', 'CONDICIONAL', 'BRINDE', 'PERMUTA'])
  tipo?: 'DIRETA' | 'CONDICIONAL' | 'BRINDE' | 'PERMUTA';

  @ApiProperty({
    description: 'Termo de busca por nome do cliente',
    required: false,
  })
  @IsOptional()
  search?: string;
}
