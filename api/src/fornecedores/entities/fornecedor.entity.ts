import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';

export class Fornecedor {
  @ApiProperty({
    description: 'ID único do fornecedor',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do fornecedor',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome do fornecedor',
    example: 'Fornecedor ABC Ltda',
  })
  nome: string;

  @ApiProperty({
    description: 'RUC/CNPJ do fornecedor',
    example: '12.345.678/0001-90',
    required: false,
  })
  ruccnpj: string | null;

  @ApiProperty({
    description: 'Email do fornecedor',
    example: 'contato@fornecedorabc.com',
    required: false,
  })
  email: string | null;

  @ApiProperty({
    description: 'Telefone do fornecedor',
    example: '+55 11 99999-9999',
    required: false,
  })
  telefone: string | null;

  @ApiProperty({
    description: 'Rede social do fornecedor',
    example: '@fornecedorabc',
    required: false,
  })
  redesocial: string | null;

  @ApiProperty({
    description: 'Status ativo do fornecedor',
    example: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data da última compra',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  ultimaCompra: Date | null;

  @ApiProperty({
    description: 'Data de criação do fornecedor',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  constructor(data?: Partial<Fornecedor>) {
    if (data) {
      Object.assign(this, data);
    }
    
    // Gerar valores padrão se não fornecidos
    this.publicId = this.publicId || uuidv7();
    this.ativo = this.ativo ?? true;
    this.createdAt = this.createdAt || new Date();
  }

  static create(data: Partial<Fornecedor>): Fornecedor {
    return new Fornecedor(data);
  }
}