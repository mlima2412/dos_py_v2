import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProdutoHistoricoPrecoDto {
  @ApiProperty({
    description: 'ID do produto',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  produtoId: number;

  @ApiProperty({
    description: 'Preço do produto',
    example: 45.99,
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  preco: number;

  @ApiProperty({
    description: 'Data do registro do preço',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  data?: Date;
}