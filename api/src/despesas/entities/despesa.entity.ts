import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
// import { Parceiro } from '../../parceiros/entities/parceiro.entity';
import { Fornecedor } from '../../fornecedores/entities/fornecedor.entity';
import { SubCategoriaDespesa } from '../../subcategoria-despesa/entities/subcategoria-despesa.entity';
import { Currency } from '../../currency/entities/currency.entity';
import { ContaDRE } from '../../conta-dre/entities/conta-dre.entity';

export class Despesa {
  @ApiProperty({
    description: 'ID único da despesa',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público da despesa',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Data de registro da despesa',
    example: '2024-01-01T00:00:00Z',
  })
  dataRegistro: Date;

  @ApiProperty({
    description: 'Valor total da despesa',
    example: 1500.5,
  })
  valorTotal: number;

  @ApiProperty({
    description: 'Descrição da despesa',
    example: 'Compra de material de escritório',
  })
  descricao: string;

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

  // @ApiProperty({
  //   description: 'Parceiro responsável pela despesa',
  //   type: () => Parceiro,
  // })
  // parceiro: Parceiro;

  @ApiProperty({
    description: 'Subcategoria da despesa',
    type: () => SubCategoriaDespesa,
  })
  subCategoria: SubCategoriaDespesa;

  @ApiProperty({
    description: 'Moeda da despesa',
    type: () => Currency,
    required: false,
  })
  currency?: Currency;

  @ApiProperty({
    description: 'ID da conta DRE para classificação contábil',
    example: 1,
    required: false,
  })
  contaDreId: number | null;

  @ApiProperty({
    description: 'Conta DRE da despesa',
    type: () => ContaDRE,
    required: false,
  })
  contaDre?: ContaDRE;

  constructor(data?: Partial<Despesa>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Despesa>): Despesa {
    const despesa = new Despesa(data);
    if (!despesa.publicId) {
      despesa.publicId = uuidv7();
    }
    return despesa;
  }
}
