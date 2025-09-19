import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';

export interface SkuSimplificado {
  id: number;
  cor?: string;
  tamanho?: string;
  produtoNome?: string;
}

export interface ConferenciaItemSimplificado {
  id: number;
  conferenciaId: number;
  skuId: number;
  qtdSistema: number;
  qtdConferencia: number;
  diferenca: number;
  ajustado: boolean;
  sku?: SkuSimplificado;
}

export class ConferenciaEstoque {
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
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

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
    enum: ['PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'],
  })
  status: string;

  @ApiProperty({
    description: 'Itens da conferência com dados simplificados',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        conferenciaId: { type: 'number' },
        skuId: { type: 'number' },
        qtdSistema: { type: 'number' },
        qtdConferencia: { type: 'number' },
        diferenca: { type: 'number' },
        ajustado: { type: 'boolean' },
        sku: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            cor: { type: 'string' },
            tamanho: { type: 'string' },
            produtoNome: { type: 'string' },
          },
        },
      },
    },
    required: false,
  })
  ConferenciaItem?: ConferenciaItemSimplificado[];

  constructor(data?: Partial<ConferenciaEstoque>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<ConferenciaEstoque>): ConferenciaEstoque {
    const conferencia = new ConferenciaEstoque(data);

    if (!conferencia.publicId) {
      conferencia.publicId = uuidv7();
    }

    if (!conferencia.dataInicio) {
      conferencia.dataInicio = new Date();
    }

    if (!conferencia.status) {
      conferencia.status = 'PENDENTE';
    }

    // Validações de negócio
    if (conferencia.dataFim && conferencia.dataFim <= conferencia.dataInicio) {
      throw new Error('Data de fim deve ser posterior à data de início');
    }

    return conferencia;
  }
}
