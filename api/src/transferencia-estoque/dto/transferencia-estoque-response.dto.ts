import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsuarioResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID do usuário', example: 'user_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Nome do usuário', example: 'João Silva' })
  nome: string;
}

export class LocalEstoqueResponseDto {
  @ApiProperty({ description: 'ID do local', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID do local', example: 'local_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Nome do local', example: 'Estoque Principal' })
  nome: string;

  @ApiProperty({ description: 'Descrição do local', example: 'Estoque principal da loja' })
  descricao: string;

  @ApiProperty({ description: 'Endereço do local', example: 'Rua das Flores, 123' })
  endereco: string;
}

export class TransferenciaEstoqueItemResponseDto {
  @ApiProperty({ description: 'ID do item da transferência', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID da transferência', example: 1 })
  transferenciaId: number;

  @ApiProperty({ description: 'ID do movimento de estoque', example: 1 })
  movimentoEstoqueId: number;
}

export class TransferenciaEstoqueResponseDto {
  @ApiProperty({ description: 'ID da transferência', example: 1 })
  id: number;

  @ApiProperty({ description: 'Public ID da transferência', example: 'transfer_123456789' })
  publicId: string;

  @ApiProperty({ description: 'Quantidade total de itens transferidos', example: 25 })
  qtd: number;

  @ApiProperty({ 
    description: 'Valor total da transferência', 
    example: 1500.50,
    type: 'number',
    format: 'decimal'
  })
  valorTotal: number;

  @ApiProperty({ description: 'Data da transferência', example: '2024-01-15T10:30:00Z' })
  dataTransferencia: Date;

  @ApiPropertyOptional({ description: 'Data do recebimento', example: '2024-01-15T14:30:00Z' })
  dataRecebimento?: Date;

  @ApiProperty({ description: 'Local de origem', type: LocalEstoqueResponseDto })
  localOrigem: LocalEstoqueResponseDto;

  @ApiProperty({ description: 'Local de destino', type: LocalEstoqueResponseDto })
  localDestino: LocalEstoqueResponseDto;

  @ApiProperty({ description: 'Usuário que enviou', type: UsuarioResponseDto })
  enviadoPorUsuario: UsuarioResponseDto;

  @ApiPropertyOptional({ description: 'Usuário que recebeu', type: UsuarioResponseDto })
  recebidoPorUsuario?: UsuarioResponseDto;

  @ApiProperty({ 
    description: 'Itens da transferência', 
    type: [TransferenciaEstoqueItemResponseDto] 
  })
  TransferenciaEstoqueItem: TransferenciaEstoqueItemResponseDto[];
}