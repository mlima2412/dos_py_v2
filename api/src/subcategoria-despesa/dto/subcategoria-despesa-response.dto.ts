import { ApiProperty } from '@nestjs/swagger';

export class SubCategoriaDespesaResponseDto {
  @ApiProperty({ example: 1 })
  idSubCategoria: number;

  @ApiProperty({ example: 1 })
  categoriaId: number;

  @ApiProperty({ example: 'Restaurante' })
  descricao: string;

  @ApiProperty({ example: true })
  ativo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({
    description: 'Categoria relacionada',
    example: {
      idCategoria: 1,
      descricao: 'Alimentação',
      ativo: true,
    },
  })
  categoria?: {
    idCategoria: number;
    descricao: string;
    ativo: boolean;
  };
}
