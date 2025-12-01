import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class Imposto {
  @ApiProperty({
    description: 'ID interno do imposto',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público (UUID) do imposto',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'Nome do imposto',
    example: 'Impuesto al Valor Agregado',
  })
  nome: string;

  @ApiProperty({
    description: 'Sigla do imposto',
    example: 'IVA',
  })
  sigla: string;

  @ApiProperty({
    description: 'Percentual do imposto',
    example: 10.0,
  })
  percentual: Decimal;

  @ApiProperty({
    description: 'Status ativo do imposto',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação do imposto',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(data?: Partial<Imposto>) {
    if (data) {
      Object.assign(this, data);
    }
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<Imposto>): Imposto {
    return new Imposto(data);
  }
}
