import { ApiProperty } from '@nestjs/swagger';

export class ParcelaDto {
  @ApiProperty({ description: 'ID da parcela' })
  id: number;

  @ApiProperty({ description: 'ID do parcelamento' })
  parcelamentoId: number;

  @ApiProperty({ description: 'Número da parcela' })
  numero: number;

  @ApiProperty({ description: 'Valor da parcela' })
  valor: number;

  @ApiProperty({
    description: 'Data de vencimento (null para parcelamento flexível)',
    nullable: true,
  })
  vencimento: Date | null;

  @ApiProperty({
    description: 'Data em que foi recebido',
    nullable: true,
  })
  recebidoEm: Date | null;

  @ApiProperty({
    description: 'Status da parcela (PENDENTE, PAGO, PAGO_ATRASADO)',
    enum: ['PENDENTE', 'PAGO', 'PAGO_ATRASADO'],
  })
  status: string;
}
