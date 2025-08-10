import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsDecimal, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateContasPagarDto {
  @ApiProperty({
    description: 'ID do parceiro responsável',
    example: 1,
  })
  @IsInt()
  parceiroId: number;

  @ApiProperty({
    description: 'Tipo de origem da conta a pagar',
    example: 'DESPESA',
  })
  @IsString()
  origemTipo: string;

  @ApiProperty({
    description: 'ID da origem da conta a pagar',
    example: 1,
  })
  @IsInt()
  origemId: number;

  @ApiProperty({
    description: 'Data de vencimento da conta',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString()
  dataVencimento: string;

  @ApiProperty({
    description: 'Valor total da conta a pagar',
    example: 1500.50,
  })
  @IsDecimal({ decimal_digits: '0,3' })
  valorTotal: number;

  @ApiProperty({
    description: 'Saldo atual da conta (soma dos valores pagos)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  saldo?: number;

  @ApiProperty({
    description: 'Descrição da conta a pagar',
    example: 'Pagamento de fornecedor XYZ',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'Indica se a conta foi totalmente paga',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  pago?: boolean;

  @ApiProperty({
    description: 'ID da moeda da conta',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  currencyId?: number;

  @ApiProperty({
    description: 'Cotação da moeda no momento da conta',
    example: 5.25,
    required: false,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  cotacao?: number;

  @ApiProperty({
    description: 'Data do pagamento completo',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataPagamento?: string;
}