import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { Produto } from '../../produto/entities/produto.entity';

export class ProdutoSKU {
  @ApiProperty({
    description: 'ID único do SKU',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do SKU',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'ID do produto pai',
    example: 1,
  })
  produtoId: number;

  @ApiProperty({
    description: 'Cor do produto',
    example: 'Azul',
    required: false,
  })
  cor: string | null;

  @ApiProperty({
    description: 'Código hexadecimal da cor',
    example: '0000FF',
    required: false,
  })
  codCor: string | null;

  @ApiProperty({
    description: 'Tamanho do produto',
    example: 'M',
    required: false,
  })
  tamanho: string | null;

  @ApiProperty({
    description: 'Quantidade mínima em estoque',
    example: 5,
  })
  qtdMinima: number;

  @ApiProperty({
    description: 'Data da última compra',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  dataUltimaCompra: Date | null;

  @ApiProperty({
    description: 'Produto pai',
    type: () => Produto,
  })
  produto?: Produto;

  constructor(data?: Partial<ProdutoSKU>) {
    if (data) {
      Object.assign(this, data);
    }

    // Gerar valores padrão se não fornecidos
    this.publicId = this.publicId || uuidv7();
    this.qtdMinima = this.qtdMinima ?? 0;
  }

  static create(data: Partial<ProdutoSKU>): ProdutoSKU {
    return new ProdutoSKU(data);
  }
}
