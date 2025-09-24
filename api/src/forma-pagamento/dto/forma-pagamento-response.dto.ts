import { ApiProperty } from '@nestjs/swagger';

export class FormaPagamentoResponseDto {
  @ApiProperty({
    description: 'ID único da forma de pagamento',
    example: 1,
  })
  idFormaPag: number;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'Nome da forma de pagamento',
    example: 'Cartão de Crédito Visa',
  })
  nome: string;

  @ApiProperty({
    description: 'Taxa da forma de pagamento (em decimal)',
    example: 2.5,
    required: false,
  })
  taxa?: number;

  @ApiProperty({
    description: 'Tempo de liberação em dias',
    example: 30,
  })
  tempoLiberacao: number;

  @ApiProperty({
    description: 'Se o imposto é calculado após o desconto da taxa',
    example: false,
  })
  impostoPosCalculo: boolean;

  @ApiProperty({
    description: 'Status ativo/inativo da forma de pagamento',
    example: true,
  })
  ativo: boolean;
}