import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoriaDespesasDto {
  @ApiProperty({
    description: 'ID da categoria',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  idCategoria?: number;

  @ApiProperty({
    description: 'Descrição da categoria de despesa',
    example: 'Alimentação',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'Status ativo da categoria',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}