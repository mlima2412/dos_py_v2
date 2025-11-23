import { ApiProperty } from '@nestjs/swagger';
import { VendaItemTipo, DescontoTipo } from '@prisma/client';
import { IsInt, IsOptional, IsEnum, Min, IsNumber } from 'class-validator';

export class CreateVendaItemDto {
  @ApiProperty({ description: 'ID da venda', example: 1 })
  @IsInt()
  @Min(1)
  vendaId: number;

  @ApiProperty({ description: 'ID do SKU', example: 123 })
  @IsInt()
  @Min(1)
  skuId: number;

  @ApiProperty({ description: 'Tipo do item', enum: VendaItemTipo, required: false })
  @IsOptional()
  @IsEnum(VendaItemTipo)
  tipo?: VendaItemTipo;

  @ApiProperty({ description: 'Quantidade reservada', example: 2 })
  @IsInt()
  @Min(1)
  qtdReservada: number;

  @ApiProperty({ description: 'Quantidade aceita (cliente ficou)', example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  qtdAceita?: number;

  @ApiProperty({ description: 'Quantidade devolvida', example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  qtdDevolvida?: number;

  @ApiProperty({ description: 'Desconto calculado final (em valor)', example: 0, required: false, type: 'number' })
  @IsOptional()
  @IsNumber()
  desconto?: number | null;

  @ApiProperty({
    description: 'Tipo de desconto',
    enum: DescontoTipo,
    example: DescontoTipo.VALOR,
    required: false
  })
  @IsOptional()
  @IsEnum(DescontoTipo)
  descontoTipo?: DescontoTipo;

  @ApiProperty({
    description: 'Valor original informado (R$ ou %)',
    example: 10,
    required: false,
    type: 'number'
  })
  @IsOptional()
  @IsNumber()
  descontoValor?: number | null;

  @ApiProperty({ description: 'Preço unitário', example: 99.9, type: 'number' })
  @IsNumber()
  @Min(0)
  precoUnit: number;
}