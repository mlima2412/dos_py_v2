import { ApiProperty } from '@nestjs/swagger';

export class SkuSimplificadoDto {
  @ApiProperty({
    description: 'ID do SKU',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Cor do SKU',
    example: 'Azul',
    required: false,
  })
  cor?: string;

  @ApiProperty({
    description: 'Tamanho do SKU',
    example: 'M',
    required: false,
  })
  tamanho?: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Camiseta Básica',
    required: false,
  })
  produtoNome?: string;
}

export class ConferenciaItemSimplificadoDto {
  @ApiProperty({
    description: 'ID único do item de conferência',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID da conferência de estoque',
    example: 1,
  })
  conferenciaId: number;

  @ApiProperty({
    description: 'ID do SKU do produto',
    example: 1,
  })
  skuId: number;

  @ApiProperty({
    description: 'Quantidade no sistema',
    example: 100,
  })
  qtdSistema: number;

  @ApiProperty({
    description: 'Quantidade conferida',
    example: 98,
  })
  qtdConferencia: number;

  @ApiProperty({
    description: 'Diferença entre sistema e conferência',
    example: -2,
  })
  diferenca: number;

  @ApiProperty({
    description: 'Se o item foi ajustado',
    example: false,
  })
  ajustado: boolean;

  @ApiProperty({
    description: 'Dados simplificados do SKU',
    type: () => SkuSimplificadoDto,
    required: false,
  })
  sku?: SkuSimplificadoDto;
}

export class ConferenciaEstoqueResponseDto {
  @ApiProperty({
    description: 'ID único da conferência de estoque',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público da conferência de estoque',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'ID do local de estoque',
    example: 1,
  })
  localEstoqueId: number;

  @ApiProperty({
    description: 'Nome do local de estoque',
    example: 'Estoque Principal',
  })
  localNome: string;

  @ApiProperty({
    description: 'Data de início da conferência',
    example: '2024-01-15T10:30:00Z',
  })
  dataInicio: Date;

  @ApiProperty({
    description: 'Data de fim da conferência',
    example: '2024-01-15T15:30:00Z',
    required: false,
  })
  dataFim: Date | null;

  @ApiProperty({
    description: 'ID do usuário responsável pela conferência',
    example: 1,
  })
  usuarioResponsavel: number;

  @ApiProperty({
    description: 'Nome do usuário responsável pela conferência',
    example: 'João da Silva',
  })
  Usuario: string;

  @ApiProperty({
    description: 'Status da conferência',
    example: 'PENDENTE',
    enum: ['PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA', 'CONCLUIDA'],
  })
  status: string;

  @ApiProperty({
    description: 'Itens da conferência com dados simplificados',
    type: () => [ConferenciaItemSimplificadoDto],
    required: false,
  })
  itens?: ConferenciaItemSimplificadoDto[];
}
