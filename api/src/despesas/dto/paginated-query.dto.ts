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
    description: 'Termo de busca para filtrar por descrição',
    example: 'material escritório',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'ID do fornecedor para filtrar',
    example: '1',
  })
  @IsOptional()
  @IsString()
  fornecedorId?: string;

  @ApiPropertyOptional({
    description: 'ID da subcategoria para filtrar',
    example: '1',
  })
  @IsOptional()
  @IsString()
  subCategoriaId?: string;

  @ApiPropertyOptional({
    description: 'ID do grupo DRE para filtrar',
    example: '1',
  })
  @IsOptional()
  @IsString()
  grupoDreId?: string;

  @ApiPropertyOptional({
    description: 'Ano para filtrar (YYYY)',
    example: '2024',
  })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({
    description: 'Mês para filtrar (1-12)',
    example: '6',
  })
  @IsOptional()
  @IsString()
  month?: string;
}
