import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';

export class LocalEstoque {
  @ApiProperty({
    description: 'ID único do local de estoque',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do local de estoque',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'ID do parceiro proprietário',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'Nome do local de estoque',
    example: 'Depósito Principal',
  })
  nome: string;

  @ApiProperty({
    description: 'Descrição do local de estoque',
    example: 'Depósito principal para produtos acabados',
  })
  descricao: string;

  @ApiProperty({
    description: 'Endereço do local de estoque',
    example: 'Rua das Flores, 123 - Centro',
  })
  endereco: string;

  constructor(data?: Partial<LocalEstoque>) {
    if (data) {
      Object.assign(this, data);
    }

    // Gerar valores padrão se não fornecidos
    this.publicId = this.publicId || uuidv7();
  }

  static create(data: Partial<LocalEstoque>): LocalEstoque {
    return new LocalEstoque(data);
  }
}