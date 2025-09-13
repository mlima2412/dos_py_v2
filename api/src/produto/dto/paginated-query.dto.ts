import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class PaginatedQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    default: '1',
    example: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @ApiPropertyOptional({
    description: 'Número de itens por página',
    default: '20',
    example: '20',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string = '20';

  @ApiPropertyOptional({
    description: 'Termo de busca para filtrar por nome do produto',
    example: 'smartphone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria para filtrar',
    example: '1',
  })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas produtos ativos',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  ativo?: string;
}