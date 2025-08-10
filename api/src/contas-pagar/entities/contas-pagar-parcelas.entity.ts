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
    description: 'Valor da parcela paga',
    example: 500.00,
  })
  valor: number;

  @ApiProperty({
    description: 'ID da moeda da parcela',
    example: 1,
    required: false,
  })
  currencyId: number | null;

  @ApiProperty({
    description: 'Cotação da moeda no momento do pagamento',
    example: 5.25,
  })
  cotacao: number;

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
    
    // Converter Decimal do Prisma para number
    if (this.valor !== undefined) {
      this.valor = Number(this.valor);
    }
    if (this.cotacao !== undefined) {
      this.cotacao = Number(this.cotacao);
    }
  }
}