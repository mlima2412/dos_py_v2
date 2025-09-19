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
}

export class ProdutoSimplificadoDto {
  @ApiProperty({
    description: 'ID do produto',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Camiseta Básica',
  })
  nome: string;
}

export class ConferenciaItemResponseDto {
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
    description: 'Dados simplificados do SKU (cor e tamanho)',
    type: () => SkuSimplificadoDto,
  })
  sku: SkuSimplificadoDto;

  @ApiProperty({
    description: 'Dados simplificados do produto (apenas nome)',
    type: () => ProdutoSimplificadoDto,
  })
  produto: ProdutoSimplificadoDto;

  @ApiProperty({
    description: 'Dados básicos da conferência de estoque',
    required: false,
  })
  ConferenciaEstoque?: {
    id: number;
    publicId: string;
    status: string;
    dataInicio: Date;
    dataFim: Date | null;
  };
}
