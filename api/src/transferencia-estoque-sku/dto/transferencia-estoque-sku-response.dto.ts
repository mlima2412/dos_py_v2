import { ApiProperty } from '@nestjs/swagger';

export class ProdutoResponseDto {
  @ApiProperty({ description: 'ID do produto', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID do produto', example: 'prod_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Nome do produto', example: 'Camiseta Polo' })
  nome: string;
}

export class ProdutoSKUResponseDto {
  @ApiProperty({ description: 'ID do SKU', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID do SKU', example: 'sku_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Cor do SKU', example: 'Azul' })
  cor?: string;

  @ApiProperty({ description: 'Código da cor (hexadecimal)', example: '#0000FF' })
  codCor?: string;

  @ApiProperty({ description: 'Tamanho do SKU', example: 'M' })
  tamanho?: string;

  @ApiProperty({ description: 'Informações do produto', type: ProdutoResponseDto })
  produto: ProdutoResponseDto;
}

export class MovimentoEstoqueResponseDto {
  @ApiProperty({ description: 'ID do movimento', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tipo de movimento', example: 'TRANSFERENCIA' })
  tipo: string;

  @ApiProperty({ description: 'Quantidade movimentada', example: 10 })
  qtd: number;

  @ApiProperty({ description: 'Data do movimento', example: '2024-01-15T10:30:00Z' })
  dataMovimento: Date;

  @ApiProperty({ description: 'Observação do movimento', example: 'Transferência entre lojas' })
  observacao?: string;

  @ApiProperty({ description: 'Informações do SKU', type: ProdutoSKUResponseDto })
  sku: ProdutoSKUResponseDto;
}

export class TransferenciaEstoqueResponseDto {
  @ApiProperty({ description: 'ID da transferência', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID da transferência', example: 'transfer_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Quantidade total de itens', example: 25 })
  qtd: number;

  @ApiProperty({ description: 'Data da transferência', example: '2024-01-15T10:30:00Z' })
  dataTransferencia: Date;
}

export class TransferenciaEstoqueSkuResponseDto {
  @ApiProperty({ description: 'ID do item da transferência', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID da transferência', example: 1 })
  transferenciaId: number;

  @ApiProperty({ description: 'ID do movimento de estoque', example: 1 })
  movimentoEstoqueId: number;

  @ApiProperty({ description: 'Informações da transferência', type: TransferenciaEstoqueResponseDto })
  TransferenciaEstoque: TransferenciaEstoqueResponseDto;

  @ApiProperty({ description: 'Informações do movimento de estoque', type: MovimentoEstoqueResponseDto })
  MovimentoEstoque: MovimentoEstoqueResponseDto;
}