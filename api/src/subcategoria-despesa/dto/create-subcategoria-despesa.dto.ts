import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubCategoriaDespesaDto {
  @ApiPropertyOptional({
    description: 'ID da subcategoria de despesa',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  idSubCategoria?: number;

  @ApiProperty({
    description: 'ID da categoria de despesa',
    example: 1,
  })
  @IsInt()
  categoriaId: number;

  @ApiProperty({
    description: 'Descrição da subcategoria de despesa',
    example: 'Material de escritório',
  })
  @IsString()
  descricao: string;

  @ApiPropertyOptional({
    description: 'Status ativo da subcategoria',
    example: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
