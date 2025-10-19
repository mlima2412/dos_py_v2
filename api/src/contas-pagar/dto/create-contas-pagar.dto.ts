import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateContasPagarDto {
  @ApiProperty({
    description: 'ID da despesa relacionada',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  despesaId?: number;

  @ApiProperty({
    description: 'Valor total da conta a pagar',
    example: 1500.5,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  valorTotal: number;

  @ApiProperty({
    description: 'Saldo atual da conta (soma dos valores pagos)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  saldo?: number;

  @ApiProperty({
    description: 'Indica se a conta foi totalmente paga',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  pago?: boolean;

  @ApiProperty({
    description: 'Data do pagamento da conta',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataPagamento?: string;
}
