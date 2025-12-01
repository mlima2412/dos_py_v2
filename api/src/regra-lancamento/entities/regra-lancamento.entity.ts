import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class RegraLancamentoAutomatico {
  @ApiProperty({
    description: 'ID interno da regra',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público (UUID) da regra',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;

  @ApiProperty({
    description: 'ID da conta DRE associada',
    example: 1,
  })
  contaDreId: number;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'ID do imposto (para deduções)',
    example: 1,
    required: false,
  })
  impostoId?: number;

  @ApiProperty({
    description: 'Nome da regra',
    example: 'Receita de Vendas',
  })
  nome: string;

  @ApiProperty({
    description: 'Tipo de gatilho (VENDA_CONFIRMADA, VENDA_COM_FATURA)',
    example: 'VENDA_CONFIRMADA',
  })
  tipoGatilho: string;

  @ApiProperty({
    description: 'Tipo de venda para filtrar (DIRETA, CONDICIONAL, BRINDE, PERMUTA)',
    example: 'DIRETA',
    required: false,
  })
  tipoVenda?: string;

  @ApiProperty({
    description: 'Campo origem para o cálculo (valorTotal, valorFrete, valorComissao)',
    example: 'valorTotal',
    required: false,
  })
  campoOrigem?: string;

  @ApiProperty({
    description: 'Percentual a aplicar (sobrescreve imposto se informado)',
    example: 10.0,
    required: false,
  })
  percentual?: Decimal;

  @ApiProperty({
    description: 'Status ativo da regra',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação da regra',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(data?: Partial<RegraLancamentoAutomatico>) {
    if (data) {
      Object.assign(this, data);
    }
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<RegraLancamentoAutomatico>): RegraLancamentoAutomatico {
    return new RegraLancamentoAutomatico(data);
  }
}
