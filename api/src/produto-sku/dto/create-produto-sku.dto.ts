import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsPositive,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProdutoSkuDto {
  @ApiProperty({
    description: 'ID do produto pai',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  produtoId: number;

  @ApiProperty({
    description: 'Cor do produto',
    example: 'Azul',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cor?: string;

  @ApiProperty({
    description: 'Código hexadecimal da cor',
    example: 255,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  codCor?: number;

  @ApiProperty({
    description: 'Tamanho do produto',
    example: 'M',
    required: false,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  tamanho?: string;

  @ApiProperty({
    description: 'Quantidade mínima em estoque',
    example: 5,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  qtdMinima?: number;

  @ApiProperty({
    description: 'Data da última compra',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  dataUltimaCompra?: Date;
}
