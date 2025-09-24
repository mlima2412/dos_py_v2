import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class PedidoCompraItem {
  @ApiProperty({
    description: 'ID único do item do pedido de compra',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID do pedido de compra',
    example: 1,
  })
  pedidoCompraId: number;

  @ApiProperty({
    description: 'ID do SKU do produto',
    example: 1,
  })
  skuId: number;

  @ApiProperty({
    description: 'Quantidade do item',
    example: 10,
  })
  qtd: number;

  @ApiProperty({
    description: 'Preço de compra unitário',
    example: 25.5,
  })
  precoCompra: Decimal;

  @ApiProperty({
    description: 'Observações do item',
    example: 'Item com desconto especial',
    required: false,
  })
  observacao: string | null;

  @ApiProperty({
    description: 'Dados do pedido de compra',
    required: false,
  })
  pedidoCompra?: {
    id: number;
    publicId: string;
  };

  @ApiProperty({
    description: 'Dados do produto SKU',
    required: false,
  })
  ProdutoSKU?: {
    id: number;
    cor: string | null;
    tamanho: string | null;
    produto: {
      id: number;
      nome: string;
    };
  };

  constructor(data?: Partial<PedidoCompraItem>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<PedidoCompraItem>): PedidoCompraItem {
    return new PedidoCompraItem(data);
  }
}
