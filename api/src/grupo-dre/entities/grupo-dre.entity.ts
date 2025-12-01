import { ApiProperty } from '@nestjs/swagger';
import { TipoDRE } from '@prisma/client';

export class GrupoDRE {
  @ApiProperty({
    description: 'ID interno do grupo DRE',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público (UUID) do grupo DRE',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;

  @ApiProperty({
    description: 'Código do grupo (ex: 1000, 2000)',
    example: '1000',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nome do grupo DRE',
    example: 'Receitas de Vendas',
  })
  nome: string;

  @ApiProperty({
    description: 'Tipo do grupo DRE',
    enum: TipoDRE,
    example: 'RECEITA',
  })
  tipo: TipoDRE;

  @ApiProperty({
    description: 'Ordem de exibição na DRE',
    example: 1,
  })
  ordem: number;

  @ApiProperty({
    description: 'Status ativo do grupo',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação do grupo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(data?: Partial<GrupoDRE>) {
    if (data) {
      Object.assign(this, data);
    }
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<GrupoDRE>): GrupoDRE {
    return new GrupoDRE(data);
  }
}
