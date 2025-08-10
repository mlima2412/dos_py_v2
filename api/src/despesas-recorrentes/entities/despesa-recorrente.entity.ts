import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { Parceiro } from '../../parceiros/entities/parceiro.entity';
import { Fornecedor } from '../../fornecedores/entities/fornecedor.entity';
import { SubCategoriaDespesa } from '../../subcategoria-despesa/entities/subcategoria-despesa.entity';

export enum FrequenciaEnum {
  SEMANAL = 'SEMANAL',
  QUINZENAL = 'QUINZENAL',
  MENSAL = 'MENSAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
}

export class DespesaRecorrente {
  @ApiProperty({
    description: 'ID único da despesa recorrente',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público da despesa recorrente',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Data de vencimento da despesa recorrente',
    example: '2024-01-01T00:00:00Z',
  })
  dataVencimento: Date;

  @ApiProperty({
    description: 'Descrição da despesa recorrente',
    example: 'Aluguel mensal do escritório',
  })
  descricao: string;

  @ApiProperty({
    description: 'Valor da despesa recorrente',
    example: 2500.00,
  })
  valor: number;

  @ApiProperty({
    description: 'Frequência da despesa recorrente',
    enum: FrequenciaEnum,
    example: FrequenciaEnum.MENSAL,
  })
  frequencia: FrequenciaEnum;

  @ApiProperty({
    description: 'Dia do vencimento da despesa recorrente',
    example: 15,
  })
  diaVencimento: number;

  @ApiProperty({
    description: 'Data de início da despesa recorrente',
    example: '2024-01-01T00:00:00Z',
  })
  dataInicio: Date;

  @ApiProperty({
    description: 'Data de fim da despesa recorrente',
    example: '2024-12-31T00:00:00Z',
    required: false,
  })
  dataFim: Date | null;

  @ApiProperty({
    description: 'ID da subcategoria da despesa',
    example: 1,
  })
  subCategoriaId: number;

  @ApiProperty({
    description: 'ID do parceiro responsável pela despesa',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'ID do fornecedor da despesa',
    example: 1,
    required: false,
  })
  fornecedorId: number | null;

  @ApiProperty({
    description: 'ID da moeda da despesa',
    example: 1,
    required: false,
  })
  currencyId: number | null;

  @ApiProperty({
    description: 'Cotação da moeda no momento da despesa',
    example: 5.25,
    required: false,
  })
  cotacao: number | null;

  @ApiProperty({
    description: 'Fornecedor da despesa',
    type: () => Fornecedor,
    required: false,
  })
  fornecedor?: Fornecedor;

  @ApiProperty({
    description: 'Parceiro responsável pela despesa',
    type: () => Parceiro,
  })
  parceiro: Parceiro;

  @ApiProperty({
    description: 'Subcategoria da despesa',
    type: () => SubCategoriaDespesa,
  })
  subCategoria: SubCategoriaDespesa;

  constructor(data?: Partial<DespesaRecorrente>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<DespesaRecorrente>): DespesaRecorrente {
    const despesaRecorrente = new DespesaRecorrente(data);
    despesaRecorrente.publicId = uuidv7();
    return despesaRecorrente;
  }
}