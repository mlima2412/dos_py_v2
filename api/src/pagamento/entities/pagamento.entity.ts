import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoVenda } from '@prisma/client';

export class Pagamento {
  @ApiProperty({ description: 'ID do pagamento' })
  id: number;

  @ApiProperty({ description: 'ID da venda associada' })
  vendaId: number;

  @ApiProperty({ description: 'ID da forma de pagamento' })
  formaPagamentoId: number;

  @ApiProperty({ enum: TipoVenda, description: 'Tipo da venda' })
  tipo: TipoVenda;

  @ApiProperty({ description: 'Valor pago' })
  valor: number;

  @ApiPropertyOptional({ description: 'Valor do delivery, se houver' })
  valorDelivery?: number | null;

  @ApiProperty({ description: 'Indica se é pagamento de entrada' })
  entrada: boolean;

  @ApiPropertyOptional({ description: 'Nome da forma de pagamento' })
  formaPagamentoNome?: string;
}