import { PartialType } from '@nestjs/swagger';
import { CreateSubCategoriaDespesaDto } from './create-subcategoria-despesa.dto';
import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubCategoriaDespesaDto extends PartialType(CreateSubCategoriaDespesaDto) {
  @ApiProperty({
    description: 'ID da subcategoria de despesa',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  idSubCategoria?: number;
}