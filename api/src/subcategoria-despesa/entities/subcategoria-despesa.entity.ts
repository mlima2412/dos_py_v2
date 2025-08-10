import { ApiProperty } from '@nestjs/swagger';
import { CategoriaDespesas } from '../../categoria-despesas/entities/categoria-despesas.entity';

export class SubCategoriaDespesa {
  @ApiProperty({
    description: 'ID interno da subcategoria de despesas',
    example: 1,
  })
  idSubCategoria: number;

  @ApiProperty({
    description: 'ID da categoria de despesas',
    example: 1,
  })
  categoriaId: number;

  @ApiProperty({
    description: 'Descrição da subcategoria de despesas',
    example: 'Restaurante',
  })
  descricao: string;

  @ApiProperty({
    description: 'Status ativo da subcategoria',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação da subcategoria',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Categoria de despesas relacionada',
    type: () => CategoriaDespesas,
  })
  categoria?: CategoriaDespesas;

  constructor(data?: Partial<SubCategoriaDespesa>) {
    if (data) {
      Object.assign(this, data);
    }
    
    // Definir valor padrão para ativo
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<SubCategoriaDespesa>): SubCategoriaDespesa {
    return new SubCategoriaDespesa(data);
  }
}