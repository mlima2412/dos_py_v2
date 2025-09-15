import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsPositive,
  IsInt,
  IsUrl,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProdutoDto {
  @ApiProperty({
    description: 'ID do produto',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  id?: number;

  @ApiProperty({
    description: 'Public ID do produto',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  publicId: string;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  parceiroId?: number;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Camiseta Básica',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Camiseta básica de algodão 100%',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'URL da imagem do produto',
    example: 'https://exemplo.com/imagem.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imgURL?: string;

  @ApiProperty({
    description: 'Preço de compra do produto',
    example: 25.5,
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  precoCompra?: number;

  @ApiProperty({
    description: 'Preço de venda do produto',
    example: 45.9,
    type: 'number',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  precoVenda: number;

  @ApiProperty({
    description: 'Se o produto é consignado',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  consignado?: boolean;

  @ApiProperty({
    description: 'ID da categoria do produto',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  categoriaId?: number;

  @ApiProperty({
    description: 'Status ativo do produto',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  //dataCadastro
  @ApiProperty({
    description: 'Data de cadastro do produto',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDate()
  dataCadastro?: Date;
}
