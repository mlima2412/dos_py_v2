import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateParcelamentoDto {
  @ApiProperty({ description: 'ID do pagamento associado' })
  @IsInt()
  idPagamento: number;

  @ApiProperty({ description: 'ID do cliente associado' })
  @IsInt()
  clienteId: number;

  @ApiProperty({ description: 'Valor total parcelado' })
  @IsNumber()
  @Min(0)
  valorTotal: number;

  @ApiProperty({ description: 'Valor já pago', required: false, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  valorPago?: number;

  @ApiProperty({ description: 'ID da forma de pagamento' })
  @IsInt()
  idFormaPag: number;

  @ApiProperty({ description: 'Situação (1 - Aberto, 2 - Concluído)', required: false, default: 1 })
  @IsInt()
  @IsOptional()
  situacao?: number;
}