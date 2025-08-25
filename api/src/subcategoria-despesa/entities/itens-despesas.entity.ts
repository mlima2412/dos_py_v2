import { ApiProperty } from '@nestjs/swagger';
import { CategoriaDespesas } from '../../categoria-despesas/entities/categoria-despesas.entity';

export class ItensDespesas {
  @ApiProperty({
    description: 'ID interno do item de despesas',
    example: 1,
  })
  idItem: number;

  @ApiProperty({
    description: 'ID da categoria de despesas',
    example: 1,
  })
  categoriaId: number;

  @ApiProperty({
    description: 'Descrição do item de despesas',
    example: 'Restaurante',
  })
  descricao: string;

  @ApiProperty({
    description: 'Status ativo do item',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação do item',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Categoria de despesas relacionada',
    type: () => CategoriaDespesas,
  })
  categoria?: CategoriaDespesas;

  constructor(data?: Partial<ItensDespesas>) {
    if (data) {
      Object.assign(this, data);
    }

    // Definir valor padrão para ativo
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<ItensDespesas>): ItensDespesas {
    return new ItensDespesas(data);
  }
}
