import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoPagamentoPedido {
  A_VISTA_IMEDIATA = 'A_VISTA_IMEDIATA',
  A_PRAZO_SEM_PARCELAS = 'A_PRAZO_SEM_PARCELAS',
  PARCELADO = 'PARCELADO',
}

export class ProcessaPedidoCompraDto {
  @ApiProperty({
    description: 'ID público do pedido de compra',
    example: '019985f6-584d-7341-b671-ab7e62aa3955',
  })
  @IsString()
  publicId: string;

  @ApiProperty({
    description: 'Tipo de pagamento do pedido',
    enum: TipoPagamentoPedido,
    example: TipoPagamentoPedido.A_PRAZO_SEM_PARCELAS,
  })
  @IsEnum(TipoPagamentoPedido)
  paymentType: TipoPagamentoPedido;

  @ApiPropertyOptional({
    description: 'Data de vencimento (obrigatório para A_PRAZO_SEM_PARCELAS)',
    example: '2025-10-17T03:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Valor de entrada (obrigatório para PARCELADO)',
    example: 15343,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  entryValue?: number;

  @ApiProperty({
    description: 'Número de parcelas',
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  installments: number;

  @ApiPropertyOptional({
    description: 'Data da primeira parcela (obrigatório para PARCELADO)',
    example: '2025-10-29T03:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  firstInstallmentDate?: string;
}
