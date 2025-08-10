import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsDecimal, IsOptional, IsInt } from 'class-validator';

export class CreateContasPagarParcelasDto {
  @ApiProperty({
    description: 'Data do pagamento da parcela',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString()
  dataPagamento: string;

  @ApiProperty({
    description: 'Valor da parcela paga',
    example: 500.00,
  })
  @IsDecimal({ decimal_digits: '0,3' })
  valor: number;

  @ApiProperty({
    description: 'ID da moeda da parcela',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  currencyId?: number;

  @ApiProperty({
    description: 'Cotação da moeda no momento do pagamento',
    example: 5.25,
    required: false,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  cotacao?: number;

  @ApiProperty({
    description: 'ID da conta a pagar relacionada',
    example: 1,
  })
  @IsInt()
  contasPagarId: number;
}