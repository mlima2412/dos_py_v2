import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { Linguagem } from '@prisma/client';
import { Parceiro } from '../../parceiros/entities/parceiro.entity';
import { CanalOrigem } from '../../canal-origem/entities/canal-origem.entity';

export class Cliente {
  @ApiProperty({
    description: 'ID único do cliente',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do cliente',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João',
  })
  nome: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
    required: false,
  })
  email?: string;

  // redesocial
  @ApiProperty({
    description: 'Rede social do cliente',
    example: '@joaosilva',
    required: false,
  })
  redeSocial?: string;

  @ApiProperty({
    description: 'Celular do cliente',
    example: '+55 11 99999-9999',
    required: false,
  })
  celular?: string;

  @ApiProperty({
    description: 'RUC/CNPJ do cliente',
    example: '12.345.678/0001-90',
    required: false,
  })
  ruccnpj?: string;

  @ApiProperty({
    description: 'Endereço do cliente',
    example: 'Rua das Flores, 123',
    required: false,
  })
  endereco?: string;

  @ApiProperty({
    description: 'Cidade do cliente',
    example: 'São Paulo',
    required: false,
  })
  cidade?: string;

  @ApiProperty({
    description: 'CEP do cliente',
    example: '01234-567',
    required: false,
  })
  cep?: string;

  @ApiProperty({
    description: 'Observações sobre o cliente',
    example: 'Cliente preferencial',
    required: false,
  })
  observacoes?: string;

  @ApiProperty({
    description: 'Linguagem preferida do cliente',
    example: 'Espanol',
    enum: Linguagem,
  })
  linguagem: Linguagem;

  @ApiProperty({
    description: 'Status ativo do cliente',
    example: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'ID do parceiro associado',
    example: 1,
  })
  parceiroId: number;

  @ApiProperty({
    description: 'ID do canal de origem',
    example: 1,
    required: false,
  })
  canalOrigemId?: number;

  @ApiProperty({
    description: 'Data de criação do cliente',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização do cliente',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Data da última compra do cliente',
    example: '2024-01-01T00:00:00Z',
  })
  ultimaCompra?: Date;

  @ApiProperty({
    description: 'Quantidade de compras do cliente',
    example: 10,
  })
  qtdCompras: number;

  @ApiProperty({
    description: 'Parceiro associado ao cliente',
    type: () => Parceiro,
    required: false,
  })
  parceiro?: Parceiro;

  @ApiProperty({
    description: 'Canal de origem do cliente',
    type: () => CanalOrigem,
    required: false,
  })
  canalOrigem?: CanalOrigem;

  constructor(data?: Partial<Cliente>) {
    if (data) {
      Object.assign(this, data);
    }

    // Gerar UUID sempre que uma nova instância é criada
    if (!this.publicId) {
      this.publicId = uuidv7();
    }

    // Definir valores padrão se não fornecidos
    if (!this.linguagem) {
      this.linguagem = Linguagem.Espanol;
    }

    if (this.ativo === undefined) {
      this.ativo = true;
    }
  }

  // Regras de negócio na entidade
  static create(data: Partial<Cliente>): Cliente {
    const cliente = new Cliente(data);
    cliente.validateBusinessRules();
    return cliente;
  }

  validateBusinessRules(): void {
    if (!this.nome || this.nome.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }

    if (!this.parceiroId) {
      throw new Error('Parceiro é obrigatório');
    }

    if (this.email) {
      this.validateEmail();
    }
  }

  validateEmail(): void {
    if (!this.email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Email inválido');
    }
  }

  activate(): void {
    this.ativo = true;
  }

  deactivate(): void {
    this.ativo = false;
  }

  updateEmail(newEmail: string): void {
    this.email = newEmail;
    this.validateEmail();
  }

  canBeDeleted(): boolean {
    // Cliente nunca pode ser removido, apenas desativado
    return false;
  }
}
