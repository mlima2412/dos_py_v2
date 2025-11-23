import { ApiProperty } from '@nestjs/swagger';

export class CategoriaResponseDto {
  @ApiProperty({ example: 1, description: 'ID da categoria' })
  id: number;

  @ApiProperty({ example: 'Roupas', description: 'Descrição da categoria' })
  descricao: string;
}

export class FornecedorResponseDto {
  @ApiProperty({ example: 1, description: 'ID do fornecedor' })
  id: number;

  @ApiProperty({ 
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
    description: 'ID público do fornecedor' 
  })
  publicId: string;

  @ApiProperty({ example: 'Fornecedor ABC Ltda', description: 'Nome do fornecedor' })
  nome: string;
}

export class CurrencyResponseDto {
  @ApiProperty({ example: 1, description: 'ID da moeda' })
  id: number;

  @ApiProperty({ 
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
    description: 'ID público da moeda' 
  })
  publicId: string;

  @ApiProperty({ example: 'Real Brasileiro', description: 'Nome da moeda' })
  nome: string;

  @ApiProperty({ example: 'R$', description: 'Prefixo da moeda' })
  prefixo: string;

  @ApiProperty({ example: 'BRL', description: 'Código ISO da moeda' })
  isoCode: string;
}

export class ProdutoSKUEstoqueResponseDto {
  @ApiProperty({ example: 1, description: 'ID do SKU' })
  id: number;

  @ApiProperty({ 
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
    description: 'ID público do SKU' 
  })
  publicId: string;

  @ApiProperty({ example: 'Azul', description: 'Cor do produto' })
  cor: string;

  @ApiProperty({ example: 'M', description: 'Tamanho do produto' })
  tamanho: string;

  @ApiProperty({ example: 'FF5733', description: 'Código hexadecimal da cor (sem #)', required: false })
  codCor?: string;

  @ApiProperty({ example: 5, description: 'Quantidade mínima em estoque' })
  qtdMinima: number;

  @ApiProperty({ example: 10, description: 'Quantidade atual em estoque' })
  estoque: number;
}

export class ProdutosPorLocalResponseDto {
  @ApiProperty({ example: 1, description: 'ID do produto' })
  id: number;

  @ApiProperty({ 
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
    description: 'ID público do produto' 
  })
  publicId: string;

  @ApiProperty({ example: 'Camiseta Básica', description: 'Nome do produto' })
  nome: string;

  @ApiProperty({ 
    example: 'Camiseta básica de algodão', 
    description: 'Descrição do produto',
    required: false 
  })
  descricao?: string;

  @ApiProperty({ 
    example: 'https://exemplo.com/imagem.jpg', 
    description: 'URL da imagem do produto',
    required: false 
  })
  imgURL?: string;

  @ApiProperty({ example: 45.90, description: 'Preço de venda' })
  precoVenda: number;

  @ApiProperty({ example: 25.50, description: 'Preço de compra' })
  precoCompra: number;

  @ApiProperty({ example: true, description: 'Status ativo do produto' })
  ativo: boolean;

  @ApiProperty({ example: false, description: 'Produto consignado' })
  consignado: boolean;

  @ApiProperty({ 
    type: CategoriaResponseDto, 
    description: 'Categoria do produto',
    required: false 
  })
  categoria?: CategoriaResponseDto;

  @ApiProperty({ 
    type: FornecedorResponseDto, 
    description: 'Fornecedor do produto',
    required: false 
  })
  fornecedor?: FornecedorResponseDto;

  @ApiProperty({ 
    type: CurrencyResponseDto, 
    description: 'Moeda do produto',
    required: false 
  })
  currency?: CurrencyResponseDto;

  @ApiProperty({ 
    type: [ProdutoSKUEstoqueResponseDto], 
    description: 'SKUs do produto com informações de estoque' 
  })
  ProdutoSKU: ProdutoSKUEstoqueResponseDto[];
}