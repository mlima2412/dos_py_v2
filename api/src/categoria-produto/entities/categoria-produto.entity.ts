import { ApiProperty } from '@nestjs/swagger';

export class CategoriaProduto {
  @ApiProperty({
    description: 'ID interno da categoria do produto',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Descrição da categoria do produto',
    example: 'Eletrônicos',
  })
  descricao: string;

  constructor(data?: Partial<CategoriaProduto>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<CategoriaProduto>): CategoriaProduto {
    return new CategoriaProduto(data);
  }
}