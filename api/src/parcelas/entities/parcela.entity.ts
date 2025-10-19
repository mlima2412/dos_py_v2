import { ApiProperty } from '@nestjs/swagger';
import { ParcelaStatus } from '@prisma/client';

export class Parcela {
  @ApiProperty({ description: 'ID da parcela' })
  id: number;

  @ApiProperty({ description: 'ID do parcelamento associado' })
  parcelamentoId: number;

  @ApiProperty({ description: 'Número da parcela' })
  numero: number;

  @ApiProperty({ description: 'Valor da parcela' })
  valor: number;

  @ApiProperty({ description: 'Data de vencimento', required: false })
  vencimento?: Date | null;

  @ApiProperty({ description: 'Data de recebimento', required: false })
  recebidoEm?: Date | null;

  @ApiProperty({ description: 'Status da parcela' })
  status: ParcelaStatus;
}