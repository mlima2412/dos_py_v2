import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubCategoriaDespesaDto {
  @ApiProperty({
    description: 'ID da subcategoria de despesa',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  idSubCategoria: number;

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

  @ApiProperty({
    description: 'Status ativo da subcategoria',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
