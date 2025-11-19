import { ApiProperty } from '@nestjs/swagger';

export class ParcelamentoDetalhadoDto {
  @ApiProperty({ description: 'ID do parcelamento' })
  id: number;

  @ApiProperty({ description: 'ID da venda' })
  vendaId: number;

  @ApiProperty({ description: 'Public ID da venda (UUID)' })
  vendaPublicId: string;

  @ApiProperty({ description: 'ID do cliente' })
  clienteId: number;

  @ApiProperty({ description: 'Nome completo do cliente' })
  clienteNome: string;

  @ApiProperty({ description: 'Data da venda' })
  dataVenda: Date;

  @ApiProperty({ description: 'ID do usuário (vendedor)' })
  usuarioId: number;

  @ApiProperty({ description: 'Nome do usuário (vendedor)' })
  usuarioNome: string;

  @ApiProperty({ description: 'Valor total da venda' })
  valorTotalVenda: number;

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

  @ApiProperty({ description: 'Saldo a pagar' })
  saldoAPagar: number;

  @ApiProperty({ description: 'Quantidade de parcelas' })
  quantidadeParcelas: number;
}
