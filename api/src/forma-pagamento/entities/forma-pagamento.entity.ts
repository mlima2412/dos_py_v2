import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class FormaPagamento {
  @ApiProperty({
    description: 'ID único da forma de pagamento',
    example: 1,
  })
  idFormaPag: number;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'Nome da forma de pagamento',
    example: 'Cartão de Crédito Visa',
  })
  nome: string;

  @ApiProperty({
    description: 'Taxa da forma de pagamento em formato percentual. Exemplo: 2.5 representa 2.5% (não 0.025). Armazenado como Decimal(12,3)',
    example: 2.5,
    required: false,
    minimum: 0,
    maximum: 100,
  })
  taxa?: Decimal;

  @ApiProperty({
    description: 'Tempo de liberação em dias',
    example: 30,
  })
  tempoLiberacao: number;

  @ApiProperty({
    description: 'Se o imposto (IVA) deve ser adicionado ao valor da taxa ao gerar despesa',
    example: false,
  })
  impostoPosCalculo: boolean;

  @ApiProperty({
    description: 'ID da conta DRE para gerar despesa automática quando há taxa',
    example: 1,
    required: false,
  })
  contaDreId?: number;

  @ApiProperty({
    description: 'Status ativo/inativo da forma de pagamento',
    example: true,
  })
  ativo: boolean;

  constructor(data?: Partial<FormaPagamento>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<FormaPagamento>): FormaPagamento {
    const formaPagamento = new FormaPagamento(data);

    if (!formaPagamento.nome || formaPagamento.nome.trim() === '') {
      throw new Error('Nome é obrigatório');
    }

    if (formaPagamento.tempoLiberacao < 0) {
      throw new Error('Tempo de liberação não pode ser negativo');
    }

    if (formaPagamento.taxa && formaPagamento.taxa.lessThan(0)) {
      throw new Error('Taxa não pode ser negativa');
    }

    return formaPagamento;
  }

  ativar(): void {
    this.ativo = true;
  }

  inativar(): void {
    this.ativo = false;
  }
}