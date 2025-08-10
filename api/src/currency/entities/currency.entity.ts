import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';

export class Currency {
  @ApiProperty({
    description: 'ID único da moeda',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público da moeda',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome da moeda',
    example: 'Real Brasileiro',
  })
  nome: string;

  @ApiProperty({
    description: 'Prefixo da moeda',
    example: 'R$',
  })
  prefixo: string;

  @ApiProperty({
    description: 'Código ISO da moeda',
    example: 'BRL',
  })
  isoCode: string;

  @ApiProperty({
    description: 'Precisão decimal da moeda',
    example: 2,
  })
  precision: number;

  @ApiProperty({
    description: 'Locale para formatação',
    example: 'pt-BR',
  })
  locale: string;

  @ApiProperty({
    description: 'Taxa de câmbio padrão',
    example: 1.0,
  })
  defaultRate: number;

  @ApiProperty({
    description: 'Status ativo da moeda',
    example: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação da moeda',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  constructor(data?: Partial<Currency>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Currency>): Currency {
    const currency = new Currency(data);
    if (!currency.publicId) {
      currency.publicId = uuidv7();
    }
    return currency;
  }

  validateBusinessRules(): void {
    if (!this.nome || this.nome.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }
    if (this.nome.length > 100) {
      throw new Error('Nome deve ter no máximo 100 caracteres');
    }
    if (!this.prefixo || this.prefixo.trim().length === 0) {
      throw new Error('Prefixo é obrigatório');
    }
    if (!this.isoCode || this.isoCode.trim().length === 0) {
      throw new Error('Código ISO é obrigatório');
    }
    if (this.isoCode.length !== 3) {
      throw new Error('Código ISO deve ter exatamente 3 caracteres');
    }
    if (this.precision < 0 || this.precision > 8) {
      throw new Error('Precisão deve estar entre 0 e 8');
    }
    if (this.defaultRate < 0) {
      throw new Error('Taxa padrão deve ser maior ou igual a zero');
    }
  }
}