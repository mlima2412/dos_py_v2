import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { Parceiro } from '../../parceiros/entities/parceiro.entity';
import { ContasPagarParcelas } from './contas-pagar-parcelas.entity';

export class ContasPagar {
  @ApiProperty({
    description: 'ID único da conta a pagar',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público da conta a pagar',
    example: uuidv7(),
  })
  publicId: string;

  @ApiProperty({
    description: 'ID do parceiro responsável',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'Tipo de origem da conta a pagar',
    example: 'DESPESA',
  })
  origemTipo: string;

  @ApiProperty({
    description: 'ID da origem da conta a pagar',
    example: 1,
  })
  origemId: number;

  @ApiProperty({
    description: 'Data de vencimento da conta',
    example: '2024-12-31T23:59:59.000Z',
  })
  dataVencimento: Date;

  @ApiProperty({
    description: 'Valor total da conta a pagar',
    example: 1500.50,
  })
  valorTotal: number;

  @ApiProperty({
    description: 'Saldo atual da conta (soma dos valores pagos)',
    example: 750.25,
  })
  saldo: number;

  @ApiProperty({
    description: 'Descrição da conta a pagar',
    example: 'Pagamento de fornecedor XYZ',
  })
  descricao: string;

  @ApiProperty({
    description: 'Indica se a conta foi totalmente paga',
    example: false,
  })
  pago: boolean;

  @ApiProperty({
    description: 'ID da moeda da conta',
    example: 1,
    required: false,
  })
  currencyId: number | null;

  @ApiProperty({
    description: 'Cotação da moeda no momento da conta',
    example: 5.25,
    required: false,
  })
  cotacao: number | null;

  @ApiProperty({
    description: 'Data do pagamento completo',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  dataPagamento: Date | null;

  @ApiProperty({
    description: 'Parceiro responsável pela conta',
    type: () => Parceiro,
    required: false,
  })
  parceiro?: Parceiro;

  @ApiProperty({
    description: 'Parcelas da conta a pagar',
    type: () => [ContasPagarParcelas],
    required: false,
  })
  contasPagarParcelas?: ContasPagarParcelas[];

  constructor(partial: Partial<ContasPagar>) {
    Object.assign(this, partial);
    
    // Converter Decimal do Prisma para number
    if (this.valorTotal !== undefined) {
      this.valorTotal = Number(this.valorTotal);
    }
    if (this.saldo !== undefined) {
      this.saldo = Number(this.saldo);
    }
    if (this.cotacao !== undefined && this.cotacao !== null) {
      this.cotacao = Number(this.cotacao);
    }
  }
}