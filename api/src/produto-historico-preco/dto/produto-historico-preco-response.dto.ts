import { ApiProperty } from '@nestjs/swagger';

export class ProdutoHistoricoPrecoResponseDto {
  @ApiProperty({
    description: 'ID único do histórico de preço',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID do produto',
    example: 1,
  })
  produtoId: number;

  @ApiProperty({
    description: 'Preço do produto',
    example: 45.99,
    type: 'number',
  })
  preco: number;

  @ApiProperty({
    description: 'Data do registro do preço',
    example: '2024-01-15T10:30:00Z',
  })
  data: Date;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Camiseta Básica',
    required: false,
  })
  nomeProduto?: string;
}