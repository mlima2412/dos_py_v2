import { ApiProperty } from '@nestjs/swagger';

export class ContaDRE {
  @ApiProperty({
    description: 'ID interno da conta DRE',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público (UUID) da conta DRE',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;

  @ApiProperty({
    description: 'ID do grupo DRE',
    example: 1,
  })
  grupoId: number;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'Código contábil opcional',
    example: '1001',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nome da conta DRE',
    example: 'Venda de Produtos',
  })
  nome: string;

  @ApiProperty({
    description: 'Nome original da V1 para mapeamento na migração',
    example: 'Taxa de Transação',
    required: false,
  })
  nomeV1?: string;

  @ApiProperty({
    description: 'Ordem de exibição dentro do grupo',
    example: 1,
  })
  ordem: number;

  @ApiProperty({
    description: 'Status ativo da conta',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação da conta',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(data?: Partial<ContaDRE>) {
    if (data) {
      Object.assign(this, data);
    }
    this.ativo = this.ativo ?? true;
  }

  static create(data: Partial<ContaDRE>): ContaDRE {
    return new ContaDRE(data);
  }
}
