import { ApiProperty } from '@nestjs/swagger';
import { Produto } from '../../produto/entities/produto.entity';

export class ProdutoHistoricoPreco {
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
    description: 'Produto relacionado',
    type: () => Produto,
    required: false,
  })
  Produto?: Produto;

  constructor(data?: Partial<ProdutoHistoricoPreco>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<ProdutoHistoricoPreco>): ProdutoHistoricoPreco {
    return new ProdutoHistoricoPreco({
      ...data,
      data: data.data || new Date(),
    });
  }
}