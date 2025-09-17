import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimento } from './create-movimento-estoque.dto';

export class LocalEstoqueResponseDto {
  @ApiProperty({ description: 'ID do local', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID do local', example: 'local_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Nome do local', example: 'Estoque Principal' })
  nome: string;

  @ApiProperty({ description: 'Descrição do local', example: 'Estoque principal da loja' })
  descricao: string;
}

export class ProdutoSKUResponseDto {
  @ApiProperty({ description: 'ID do SKU', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID do SKU', example: 'sku_123456789' })
  publicId: string;

  @ApiPropertyOptional({ description: 'Cor do produto', example: 'Azul' })
  cor?: string;

  @ApiPropertyOptional({ description: 'Tamanho do produto', example: 'M' })
  tamanho?: string;

  @ApiProperty({ description: 'Informações do produto' })
  produto: {
    id: number;
    publicId: string;
    nome: string;
  };
}

export class UsuarioResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID do usuário', example: 'user_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Nome do usuário', example: 'João Silva' })
  nome: string;
}

export class MovimentoEstoqueResponseDto {
  @ApiProperty({ description: 'ID do movimento', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tipo de movimento', enum: TipoMovimento })
  tipo: TipoMovimento;

  @ApiProperty({ description: 'Quantidade movimentada', example: 10 })
  qtd: number;

  @ApiProperty({ description: 'Data do movimento', example: '2024-01-15T10:30:00Z' })
  dataMovimento: Date;

  @ApiPropertyOptional({ description: 'Observação do movimento' })
  observacao?: string;

  @ApiProperty({ description: 'Informações do SKU', type: ProdutoSKUResponseDto })
  sku: ProdutoSKUResponseDto;

  @ApiProperty({ description: 'Informações do usuário', type: UsuarioResponseDto })
  Usuario: UsuarioResponseDto;

  @ApiPropertyOptional({ description: 'Local de origem', type: LocalEstoqueResponseDto })
  localOrigem?: LocalEstoqueResponseDto;

  @ApiPropertyOptional({ description: 'Local de destino', type: LocalEstoqueResponseDto })
  localDestino?: LocalEstoqueResponseDto;
}