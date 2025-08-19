import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { ContasPagar } from './contas-pagar.entity';

export class ContasPagarParcelas {
  @ApiProperty({
    description: 'ID único da parcela',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público da parcela',
    example: uuidv7(),
  })
  publicId: string;

  @ApiProperty({
    description: 'Data do pagamento da parcela',
    example: '2024-12-31T23:59:59.000Z',
  })
  dataPagamento: Date;

  @ApiProperty({
    description: 'Data de vencimento da parcela',
    example: '2024-12-31T23:59:59.000Z',
  })
  dataVencimento: Date;

  @ApiProperty({
    description: 'Valor da parcela',
    example: 500.00,
  })
  valor: number;

  @ApiProperty({
    description: 'Indica se a parcela foi paga',
    example: false,
  })
  pago: boolean;

  @ApiProperty({
    description: 'ID da conta a pagar relacionada',
    example: 1,
  })
  contasPagarId: number;

  @ApiProperty({
    description: 'Conta a pagar relacionada',
    type: () => ContasPagar,
    required: false,
  })
  contasPagar?: ContasPagar;

  constructor(partial: Partial<ContasPagarParcelas>) {
    Object.assign(this, partial);
  }
}