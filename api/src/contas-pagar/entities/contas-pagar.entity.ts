import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
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
    description: 'ID da despesa relacionada',
    example: 1,
    required: false,
  })
  despesaId: number | null;

  @ApiProperty({
    description: 'Data de criação da conta',
    example: '2024-12-31T23:59:59.000Z',
  })
  dataCriacao: Date;

  @ApiProperty({
    description: 'Data do pagamento da conta',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  dataPagamento?: Date;

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
    description: 'Indica se a conta foi totalmente paga',
    example: false,
  })
  pago: boolean;

  @ApiProperty({
    description: 'Parcelas da conta a pagar',
    type: () => [ContasPagarParcelas],
    required: false,
  })
  contasPagarParcelas?: ContasPagarParcelas[];

  constructor(partial: Partial<ContasPagar>) {
    Object.assign(this, partial);
  }
}