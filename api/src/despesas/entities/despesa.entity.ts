import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
//import { Parceiro } from '../../parceiros/entities/parceiro.entity';
import { Fornecedor } from '../../fornecedores/entities/fornecedor.entity';
import { SubCategoriaDespesa } from '../../subcategoria-despesa/entities/subcategoria-despesa.entity';

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
    description: 'Data da despesa',
    example: '2024-01-01T00:00:00Z',
  })
  dataDespesa: Date;

  @ApiProperty({
    description: 'Valor da despesa',
    example: 1500.50,
  })
  valor: number;

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
    description: 'Data de vencimento da despesa',
    example: '2024-01-15T00:00:00Z',
    required: false,
  })
  dataVencimento: Date | null;

  @ApiProperty({
    description: 'Data de pagamento da despesa',
    example: '2024-01-10T00:00:00Z',
    required: false,
  })
  dataPagamento: Date | null;

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