import { ApiProperty } from '@nestjs/swagger';
import { VendaItemTipo, DescontoTipo } from '@prisma/client';

export class VendaItemEntity {
  @ApiProperty({ description: 'ID do item da venda', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID da venda', example: 1 })
  vendaId: number;

  @ApiProperty({ description: 'ID do SKU vendido', example: 123 })
  skuId: number;

  @ApiProperty({ description: 'Tipo do item', enum: VendaItemTipo, example: VendaItemTipo.NORMAL })
  tipo: VendaItemTipo;

  @ApiProperty({ description: 'Quantidade reservada', example: 2 })
  qtdReservada: number;

  @ApiProperty({ description: 'Quantidade aceita (ficou com cliente)', example: 0, required: false })
  qtdAceita?: number;

  @ApiProperty({ description: 'Quantidade devolvida', example: 0, required: false })
  qtdDevolvida?: number;

  @ApiProperty({ description: 'Desconto calculado final (em valor)', example: 0, required: false, type: 'number' })
  desconto?: number | null;

  @ApiProperty({
    description: 'Tipo de desconto aplicado',
    enum: DescontoTipo,
    example: DescontoTipo.VALOR,
    required: false
  })
  descontoTipo?: DescontoTipo | null;

  @ApiProperty({
    description: 'Valor original informado (R$ ou %)',
    example: 10,
    required: false,
    type: 'number'
  })
  descontoValor?: number | null;

  @ApiProperty({ description: 'Preço unitário', example: 99.9, type: 'number' })
  precoUnit: number;

  // Metadados do SKU relacionados
  @ApiProperty({ description: 'Public ID do SKU', required: false })
  skuPublicId?: string;

  @ApiProperty({ description: 'Cor do SKU', required: false })
  skuCor?: string | null;

  @ApiProperty({ description: 'Código da cor do SKU (hex)', required: false })
  skuCodCor?: string | null;

  @ApiProperty({ description: 'Tamanho do SKU', required: false })
  skuTamanho?: string | null;
}