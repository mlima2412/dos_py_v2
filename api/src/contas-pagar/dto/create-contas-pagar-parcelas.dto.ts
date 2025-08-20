import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsDecimal, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateContasPagarParcelasDto {
  @ApiProperty({
    description: 'Data do pagamento da parcela',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString()
  dataPagamento: string;

  @ApiProperty({
    description: 'Data de vencimento da parcela',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString()
  dataVencimento: string;

  @ApiProperty({
    description: 'Valor da parcela',
    example: 500.00,
  })
  @IsDecimal({ decimal_digits: '0,3' })
  valor: number;

  @ApiProperty({
    description: 'Se a parcela foi paga',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  pago?: boolean;

  @ApiProperty({
    description: 'ID da conta a pagar relacionada',
    example: 1,
  })
  @IsInt()
  contasPagarId: number;

  @ApiProperty({
    description: 'ID da moeda',
    example: 1,
  })
  @IsInt()
  currencyId: number;
}