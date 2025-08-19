import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Currency } from '../../currency/entities/currency.entity';

export class Parceiro {
  @ApiProperty({
    description: 'ID único do parceiro',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do parceiro',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome do parceiro',
    example: 'Parceiro ABC Ltda',
  })
  nome: string;

  @ApiProperty({
    description: 'RUC/CNPJ do parceiro',
    example: '12.345.678/0001-90',
    required: false,
  })
  ruccnpj: string | null;

  @ApiProperty({
    description: 'Email do parceiro',
    example: 'contato@parceiroabc.com',
  })
  email: string;

  @ApiProperty({
    description: 'Rede social do parceiro',
    example: 'https://instagram.com/parceiroabc',
    required: false,
  })
  redesocial: string | null;

  @ApiProperty({
    description: 'Telefone do parceiro',
    example: '+55 11 99999-9999',
    required: false,
  })
  telefone: string | null;

  @ApiProperty({
    description: 'ID da moeda do parceiro',
    example: 1,
    required: false,
  })
  currencyId: number | null;

  @ApiProperty({
    description: 'Status ativo do parceiro',
    example: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'URL do logo do parceiro',
    example: 'https://exemplo.com/logo.png',
    required: false,
  })
  logourl: string | null;

  @ApiProperty({
    description: 'URL da imagem reduzida do parceiro',
    example: 'https://exemplo.com/thumb.png',
    required: false,
  })
  thumburl: string | null;

  @ApiProperty({
    description: 'Data de criação do parceiro',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Clientes associados ao parceiro',
    type: () => [Cliente],
    required: false,
  })
  clientes?: Cliente[];

  @ApiProperty({
    description: 'Moeda do parceiro',
    type: () => Currency,
    required: false,
  })
  currency?: Currency;

  constructor(data?: Partial<Parceiro>) {
    if (data) {
      Object.assign(this, data);
    }

    // Gerar valores padrão se não fornecidos
    this.publicId = this.publicId || uuidv7();
    this.ativo = this.ativo ?? true;
    this.createdAt = this.createdAt || new Date();
  }

  static create(data: Partial<Parceiro>): Parceiro {
    return new Parceiro(data);
  }
}
