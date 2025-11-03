import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItensDespesasDto {
  @ApiPropertyOptional({
    description: 'ID da subcategoria de despesa',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  idSubCategoriaDespesa?: number;

  @ApiProperty({
    description: 'ID da categoria de despesa',
    example: 1,
  })
  @IsInt()
  categoriaId: number;

  @ApiProperty({
    description: 'Descrição do item de despesa',
    example: 'Material de escritório',
  })
  @IsString()
  descricao: string;

  @ApiPropertyOptional({
    description: 'Status ativo do item',
    example: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
