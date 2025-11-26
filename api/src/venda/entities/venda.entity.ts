import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import {
  VendaStatus,
  VendaTipo,
  VendaItemTipo,
  TipoVenda,
} from '@prisma/client';

export class PagamentoEntity {
  @ApiProperty({ description: 'ID do pagamento' })
  id: number;

  @ApiProperty({ description: 'ID da venda associada' })
  vendaId: number;

  @ApiProperty({ description: 'ID da forma de pagamento' })
  formaPagamentoId: number;

  @ApiProperty({ enum: TipoVenda, description: 'Tipo do pagamento' })
  tipo: TipoVenda;

  @ApiProperty({ description: 'Valor pago', type: 'number' })
  valor: number;

  @ApiProperty({
    description: 'Valor do delivery',
    required: false,
    type: 'number',
  })
  valorDelivery?: number | null;

  @ApiProperty({ description: 'Indica se é pagamento de entrada' })
  entrada: boolean;

  @ApiProperty({ description: 'Nome da forma de pagamento', required: false })
  formaPagamentoNome?: string;
}

export class VendaItemEntity {
  @ApiProperty({ description: 'ID do item da venda', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID da venda', example: 1 })
  vendaId: number;

  @ApiProperty({ description: 'ID do SKU vendido', example: 123 })
  skuId: number;

  @ApiProperty({
    description: 'Tipo do item',
    enum: VendaItemTipo,
    example: VendaItemTipo.NORMAL,
  })
  tipo: VendaItemTipo;

  @ApiProperty({ description: 'Quantidade reservada', example: 2 })
  qtdReservada: number;

  @ApiProperty({
    description: 'Quantidade aceita (ficou com cliente)',
    example: 1,
  })
  qtdAceita: number;

  @ApiProperty({ description: 'Quantidade devolvida', example: 1 })
  qtdDevolvida: number;

  @ApiProperty({
    description: 'Desconto do item (valor final calculado)',
    example: 0,
    required: false,
    type: 'number',
  })
  desconto?: number | null;

  @ApiProperty({
    description: 'Tipo de desconto aplicado',
    enum: ['VALOR', 'PERCENTUAL'],
    example: 'VALOR',
    required: false,
  })
  descontoTipo?: 'VALOR' | 'PERCENTUAL' | null;

  @ApiProperty({
    description: 'Valor original informado pelo usuário (R$ ou %)',
    example: 10,
    required: false,
    type: 'number',
  })
  descontoValor?: number | null;

  @ApiProperty({ description: 'Preço unitário', example: 99.9, type: 'number' })
  precoUnit: number;

  @ApiProperty({
    description: 'Custo de compra do produto no momento da venda',
    example: 50.0,
    required: false,
    type: 'number',
  })
  custoCompra?: number | null;

  @ApiProperty({ description: 'Public ID do SKU', required: false })
  skuPublicId?: string;

  @ApiProperty({ description: 'Cor do SKU', required: false })
  skuCor?: string | null;

  @ApiProperty({ description: 'Código da cor do SKU (hex)', required: false })
  skuCodCor?: string | null;

  @ApiProperty({ description: 'Tamanho do SKU', required: false })
  skuTamanho?: string | null;

  @ApiProperty({ description: 'ID do produto do SKU', required: false })
  produtoId?: number;

  @ApiProperty({ description: 'Public ID do produto', required: false })
  produtoPublicId?: string;

  @ApiProperty({ description: 'Nome do produto', required: false })
  produtoNome?: string;

  @ApiProperty({
    description: 'Preço de venda atual do produto',
    required: false,
    type: 'number',
  })
  produtoPrecoVenda?: number;
}

export class Venda {
  @ApiProperty({ description: 'ID interno da venda', example: 1 })
  id: number;

  @ApiProperty({
    description: 'ID público da venda',
    example: 'vnd_01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;

  @ApiProperty({ description: 'ID do usuário que criou a venda', example: 1 })
  usuarioId: number;

  @ApiProperty({ description: 'ID do parceiro', example: 1 })
  parceiroId: number;

  @ApiProperty({ description: 'ID do local de saída', example: 1 })
  localSaidaId: number;

  @ApiProperty({ description: 'ID do cliente', example: 1 })
  clienteId: number;

  @ApiProperty({
    description: 'Tipo da venda',
    enum: VendaTipo,
    example: VendaTipo.DIRETA,
  })
  tipo: VendaTipo;

  @ApiProperty({
    description: 'Status da venda',
    enum: VendaStatus,
    example: VendaStatus.PEDIDO,
  })
  status: VendaStatus;

  @ApiProperty({
    description: 'Data da venda',
    example: '2024-01-01T00:00:00Z',
  })
  dataVenda: Date;

  @ApiProperty({
    description: 'Data de entrega',
    example: '2024-01-02T00:00:00Z',
    required: false,
  })
  dataEntrega?: Date | null;

  @ApiProperty({
    description: 'Valor do frete',
    example: 0,
    required: false,
    type: 'number',
  })
  valorFrete?: number | null;

  @ApiProperty({
    description: 'Desconto total da venda',
    example: 0,
    required: false,
    type: 'number',
  })
  desconto?: number | null;

  @ApiProperty({
    description: 'Valor total da venda',
    example: 120.5,
    required: false,
    type: 'number',
  })
  valorTotal?: number | null;

  @ApiProperty({ description: 'RUC/CNPJ da fatura da venda', required: false })
  ruccnpj?: string | null;

  @ApiProperty({ description: 'Nome para a fatura da venda', required: false })
  nomeFatura?: string | null;

  @ApiProperty({ description: 'Número da fatura', required: false })
  numeroFatura?: string | null;

  @ApiProperty({ description: 'Observação da venda', required: false })
  observacao?: string | null;

  @ApiProperty({
    description: 'Valor da comissão',
    example: 0,
    required: false,
    type: 'number',
  })
  valorComissao?: number | null;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João',
    required: false,
  })
  clienteNome?: string;

  @ApiProperty({
    description: 'Nome do usuário que criou a venda',
    example: 'Maria Lima',
    required: false,
  })
  usuarioNome?: string;

  @ApiProperty({
    description: 'Itens vendidos',
    type: () => [VendaItemEntity],
    required: false,
  })
  VendaItem?: VendaItemEntity[];

  @ApiProperty({
    description: 'Pagamentos da venda',
    type: () => [PagamentoEntity],
    required: false,
  })
  Pagamento?: PagamentoEntity[];

  constructor(data?: Partial<Venda>) {
    if (data) {
      Object.assign(this, data);
    }
    // Gerar publicId padrão
    if (!this.publicId) {
      this.publicId = uuidv7();
    }
    // Defaults
    this.tipo = this.tipo ?? VendaTipo.DIRETA;
    this.status = this.status ?? VendaStatus.PEDIDO;
    this.dataVenda = this.dataVenda ?? new Date();
  }
}
