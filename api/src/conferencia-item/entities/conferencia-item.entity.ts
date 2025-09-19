import { ApiProperty } from '@nestjs/swagger';

export interface SkuSimplificado {
  id: number;
  cor?: string;
  tamanho?: string;
}

export interface ProdutoSimplificado {
  id: number;
  nome: string;
}

export class ConferenciaItem {
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
    type: 'object',
    properties: {
      id: { type: 'number' },
      cor: { type: 'string' },
      tamanho: { type: 'string' },
    },
  })
  sku: SkuSimplificado;

  @ApiProperty({
    description: 'Dados simplificados do produto (apenas nome)',
    type: 'object',
    properties: {
      id: { type: 'number' },
      nome: { type: 'string' },
    },
  })
  produto: ProdutoSimplificado;

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

  constructor(data?: Partial<ConferenciaItem>) {
    if (data) {
      Object.assign(this, data);
      // Calcular diferença automaticamente
      if (data.qtdSistema !== undefined && data.qtdConferencia !== undefined) {
        this.diferenca = data.qtdConferencia - data.qtdSistema;
      }
    }
  }

  static create(data: Partial<ConferenciaItem>): ConferenciaItem {
    const item = new ConferenciaItem(data);

    if (item.qtdSistema === undefined) {
      item.qtdSistema = 0;
    }

    if (item.qtdConferencia === undefined) {
      item.qtdConferencia = 0;
    }

    if (item.ajustado === undefined) {
      item.ajustado = false;
    }

    // Calcular diferença
    item.diferenca = item.qtdConferencia - item.qtdSistema;

    // Validações de negócio
    if (!item.conferenciaId) {
      throw new Error('ID da conferência é obrigatório');
    }

    if (!item.skuId) {
      throw new Error('ID do SKU é obrigatório');
    }

    if (item.qtdSistema < 0) {
      throw new Error('Quantidade do sistema não pode ser negativa');
    }

    if (item.qtdConferencia < 0) {
      throw new Error('Quantidade conferida não pode ser negativa');
    }

    return item;
  }
}
