import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { ProdutoSKU } from '../../produto-sku/entities/produto-sku.entity';
import { CategoriaProduto } from '../../categoria-produto/entities/categoria-produto.entity';
import { Parceiro } from '../../parceiros/entities/parceiro.entity';
import { Fornecedor } from '../../fornecedores/entities/fornecedor.entity';
import { Currency } from '../../currency/entities/currency.entity';

export class Produto {
  @ApiProperty({
    description: 'ID único do produto',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do produto',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Camiseta Básica',
  })
  nome: string;

  @ApiProperty({
    description: 'Data de cadastro do produto',
    example: '2024-01-15T10:30:00Z',
  })
  dataCadastro: Date;

  @ApiProperty({
    description: 'Status ativo do produto',
    example: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Se o produto é consignado',
    example: false,
  })
  consignado: boolean;

  @ApiProperty({
    description: 'ID da categoria do produto',
    example: 1,
    required: false,
  })
  categoriaId: number | null;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Camiseta básica de algodão 100%',
    required: false,
  })
  descricao: string | null;

  @ApiProperty({
    description: 'URL da imagem do produto',
    example: 'https://exemplo.com/imagem.jpg',
    required: false,
  })
  imgURL: string | null;

  @ApiProperty({
    description: 'Preço de compra do produto',
    example: 25.5,
    type: 'number',
  })
  precoCompra: number;

  @ApiProperty({
    description: 'Preço de venda do produto',
    example: 45.9,
    type: 'number',
  })
  precoVenda: number;

  @ApiProperty({
    description: 'ID do parceiro proprietário',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'ID do fornecedor do produto',
    example: 1,
    required: false,
  })
  fornecedorId: number | null;

  @ApiProperty({
    description: 'ID da moeda do produto',
    example: 1,
    required: false,
  })
  currencyId: number | null;

  @ApiProperty({
    description: 'Categoria do produto',
    type: () => CategoriaProduto,
    required: false,
  })
  categoria?: CategoriaProduto;

  @ApiProperty({
    description: 'Parceiro proprietário do produto',
    type: () => Parceiro,
  })
  Parceiro?: Parceiro;

  @ApiProperty({
    description: 'Fornecedor do produto',
    type: () => Fornecedor,
    required: false,
  })
  fornecedor?: Fornecedor;

  @ApiProperty({
    description: 'Moeda do produto',
    type: () => Currency,
    required: false,
  })
  currency?: Currency;

  @ApiProperty({
    description: 'SKUs do produto',
    type: () => [ProdutoSKU],
    required: false,
  })
  ProdutoSKU?: ProdutoSKU[];

  constructor(data?: Partial<Produto>) {
    if (data) {
      Object.assign(this, data);
    }

    // Gerar valores padrão se não fornecidos
    this.publicId = this.publicId || uuidv7();
    this.ativo = this.ativo ?? true;
    this.consignado = this.consignado ?? false;
    this.dataCadastro = this.dataCadastro || new Date();
  }

  static create(data: Partial<Produto>): Produto {
    return new Produto(data);
  }
}
