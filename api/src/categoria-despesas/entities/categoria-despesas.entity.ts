import { ApiProperty } from '@nestjs/swagger';

export class CategoriaDespesas {
  @ApiProperty({
    description: 'ID interno da categoria de despesas',
    example: 1,
  })
  idCategoria: number;

  @ApiProperty({
    description: 'Descrição da categoria de despesas',
    example: 'Alimentação',
  })
  descricao: string;

  @ApiProperty({
    description: 'Status ativo da categoria',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação da categoria',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(data?: Partial<CategoriaDespesas>) {
    if (data) {
      Object.assign(this, data);
    }
    
    // Definir valor padrão para ativo
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<CategoriaDespesas>): CategoriaDespesas {
    return new CategoriaDespesas(data);
  }
}