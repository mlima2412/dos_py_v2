import { ApiProperty } from '@nestjs/swagger';

export class Parcelamento {
  @ApiProperty({ description: 'ID do parcelamento' })
  id: number;

  @ApiProperty({ description: 'ID do cliente associado' })
  clienteId: number;

  @ApiProperty({ description: 'ID da venda associada' })
  vendaId: number;

  @ApiProperty({ description: 'Valor total parcelado' })
  valorTotal: number;

  @ApiProperty({ description: 'Valor já pago neste parcelamento', default: 0 })
  valorPago: number;

  @ApiProperty({
    description: 'Situação do parcelamento (1 - Aberto, 2 - Concluído)',
    default: 1,
  })
  situacao: number;

  @ApiProperty({ description: 'Nome do cliente', required: false })
  clienteNome?: string;
}
