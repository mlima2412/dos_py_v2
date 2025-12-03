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
    description: 'Taxa da forma de pagamento em formato percentual. Exemplo: 2.5 representa 2.5% (não 0.025). Valor entre 0 e 100',
    example: 2.5,
    required: false,
    minimum: 0,
    maximum: 100,
  })
  taxa?: number;

  @ApiProperty({
    description: 'Tempo de liberação em dias',
    example: 30,
  })
  tempoLiberacao: number;

  @ApiProperty({
    description: 'Se o imposto (IVA) deve ser adicionado ao valor da taxa ao gerar despesa',
    example: false,
  })
  impostoPosCalculo: boolean;

  @ApiProperty({
    description: 'ID da conta DRE para gerar despesa automática quando há taxa',
    example: 1,
    required: false,
  })
  contaDreId?: number;

  @ApiProperty({
    description: 'Status ativo/inativo da forma de pagamento',
    example: true,
  })
  ativo: boolean;
}