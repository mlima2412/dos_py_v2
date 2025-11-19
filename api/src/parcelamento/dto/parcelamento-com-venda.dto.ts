import { ApiProperty } from '@nestjs/swagger';

export class ParcelamentoComVendaDto {
  @ApiProperty({ description: 'ID do parcelamento' })
  id: number;

  @ApiProperty({ description: 'ID da venda' })
  vendaId: number;

  @ApiProperty({ description: 'ID do cliente' })
  clienteId: number;

  @ApiProperty({ description: 'Nome do cliente' })
  clienteNome: string;

  @ApiProperty({ description: 'Data da venda' })
  dataVenda: Date;

  @ApiProperty({ description: 'Valor total do parcelamento' })
  valorTotal: number;

  @ApiProperty({ description: 'Valor já pago' })
  valorPago: number;

  @ApiProperty({
    description: 'Situação do parcelamento (1 - Aberto, 2 - Concluído)',
  })
  situacao: number;

  @ApiProperty({
    description: 'Descrição da situação (Aberto/Concluído)',
  })
  situacaoDescricao: string;
}
