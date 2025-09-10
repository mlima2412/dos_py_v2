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
    description: 'Termo de busca para filtrar por nome, sobrenome ou email',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'ID do canal de origem para filtrar',
    example: '1',
  })
  @IsOptional()
  @IsString()
  canalOrigemId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas clientes ativos',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  ativo?: string;
}