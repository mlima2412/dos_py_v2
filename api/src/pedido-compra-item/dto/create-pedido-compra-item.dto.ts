import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePedidoCompraItemDto {
  @ApiProperty({
    description: 'ID do pedido de compra',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID do pedido de compra é obrigatório' })
  @IsNumber({}, { message: 'ID do pedido de compra deve ser um número' })
  @IsPositive({ message: 'ID do pedido de compra deve ser positivo' })
  @Type(() => Number)
  pedidoCompraId: number;

  @ApiProperty({
    description: 'ID do SKU do produto',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID do SKU é obrigatório' })
  @IsNumber({}, { message: 'ID do SKU deve ser um número' })
  @IsPositive({ message: 'ID do SKU deve ser positivo' })
  @Type(() => Number)
  skuId: number;

  @ApiProperty({
    description: 'Quantidade do item',
    example: 10,
  })
  @IsNotEmpty({ message: 'Quantidade é obrigatória' })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  @Type(() => Number)
  qtd: number;

  @ApiProperty({
    description: 'Preço de compra unitário',
    example: 25.5,
  })
  @IsNotEmpty({ message: 'Preço de compra é obrigatório' })
  @IsNumber({}, { message: 'Preço de compra deve ser um número' })
  @IsPositive({ message: 'Preço de compra deve ser positivo' })
  @Type(() => Number)
  precoCompra: number;

  @ApiProperty({
    description: 'Observações do item',
    example: 'Item com desconto especial',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser uma string' })
  observacao?: string;
}
