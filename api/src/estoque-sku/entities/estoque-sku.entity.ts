import { ApiProperty } from '@nestjs/swagger';

export class EstoqueSku {
  @ApiProperty({
    description: 'ID do SKU do produto',
    example: 1,
  })
  skuId: number;

  @ApiProperty({
    description: 'ID do local de estoque',
    example: 1,
  })
  localId: number;

  @ApiProperty({
    description: 'Quantidade em estoque',
    example: 50,
  })
  qtd: number;

  @ApiProperty({
    description: 'Informações do SKU',
    required: false,
  })
  sku?: {
    id: number;
    cor: string;
    tamanho: string;
    produto: {
      id: number;
      nome: string;
    };
  };

  @ApiProperty({
    description: 'Informações do local de estoque',
    required: false,
  })
  local?: {
    id: number;
    nome: string;
  };

  constructor(data?: Partial<EstoqueSku>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<EstoqueSku>): EstoqueSku {
    return new EstoqueSku(data);
  }
}
