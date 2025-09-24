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
    description: 'Termo de busca para filtrar por observação',
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
    description: 'Status do pedido para filtrar',
    example: 'EDICAO',
    enum: ['EDICAO', 'CONCLUSAO', 'FINALIZADO'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'ID do local de entrada para filtrar',
    example: '1',
  })
  @IsOptional()
  @IsString()
  localEntradaId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas pedidos consignados',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  consignado?: string;
}