import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';
import { uuidv7 } from 'uuidv7';
import { StatusPedidoCompra } from '../enums/status-pedido-compra.enum';

export class PedidoCompra {
  @ApiProperty({
    description: 'ID único do pedido de compra',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do pedido de compra (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'ID do local de entrada do estoque',
    example: 1,
  })
  localEntradaId: number;

  @ApiProperty({
    description: 'ID do fornecedor',
    example: 1,
  })
  fornecedorId: number;

  @ApiProperty({
    description: 'Data do pedido',
    example: '2024-01-15T10:30:00Z',
  })
  dataPedido: Date;

  @ApiProperty({
    description: 'Data de entrega prevista',
    example: '2024-01-20T10:30:00Z',
    required: false,
  })
  dataEntrega: Date | null;

  @ApiProperty({
    description: 'Valor do frete',
    example: 50.0,
    required: false,
  })
  valorFrete: Decimal | null;

  @ApiProperty({
    description: 'Valor total do pedido',
    example: 1500.0,
    required: false,
  })
  valorTotal: Decimal | null;

  @ApiProperty({
    description: 'Observações do pedido',
    example: 'Pedido urgente',
    required: false,
  })
  observacao: string | null;

  @ApiProperty({
    description: 'Valor da comissão',
    example: 75.0,
    required: false,
  })
  valorComissao: Decimal | null;

  @ApiProperty({
    description: 'Cotação da moeda',
    example: 1.0,
    required: false,
  })
  cotacao: number | null;

  @ApiProperty({
    description: 'ID da moeda',
    example: 1,
    required: false,
  })
  currencyId: number | null;

  @ApiProperty({
    description: 'Indica se o pedido é consignado',
    example: false,
  })
  consignado: boolean;

  @ApiProperty({
    description: 'Status do pedido',
    example: StatusPedidoCompra.EDICAO,
    enum: StatusPedidoCompra,
  })
  status: StatusPedidoCompra;

  @ApiProperty({
    description: 'Dados do fornecedor',
    required: false,
  })
  fornecedor?: {
    id: number;
    nome: string;
  };

  @ApiProperty({
    description: 'Dados da moeda',
    required: false,
  })
  currency?: {
    id: number;
    nome: string;
  };

  @ApiProperty({
    description: 'Dados do parceiro',
    required: false,
  })
  Parceiro?: {
    id: number;
    nome: string;
  };

  @ApiProperty({
    description: 'Dados do local de entrada',
    required: false,
  })
  LocalEntrada?: {
    id: number;
    nome: string;
  };

  constructor(data?: Partial<PedidoCompra>) {
    if (data) {
      Object.assign(this, data);
      if (!this.publicId) {
        this.publicId = uuidv7();
      }
    }
  }

  static create(data: Partial<PedidoCompra>): PedidoCompra {
    return new PedidoCompra(data);
  }
}
