import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { Cliente } from '../../clientes/entities/cliente.entity';

export class CanalOrigem {
  @ApiProperty({
    description: 'ID único do canal de origem',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do canal de origem',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome do canal de origem',
    example: 'Site Institucional',
  })
  nome: string;

  @ApiProperty({
    description: 'Descrição do canal de origem',
    example: 'Clientes que chegaram através do site institucional',
    required: false,
  })
  descricao?: string;

  @ApiProperty({
    description: 'Status ativo do canal de origem',
    example: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'Data de criação do canal de origem',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Clientes associados ao canal de origem',
    type: () => [Cliente],
    required: false,
  })
  clientes?: Cliente[];

  constructor(data?: Partial<CanalOrigem>) {
    if (data) {
      Object.assign(this, data);
    }
    
    // Gerar UUID sempre que uma nova instância é criada
    if (!this.publicId) {
      this.publicId = uuidv7();
    }
    
    // Definir valores padrão se não fornecidos
    if (this.ativo === undefined) {
      this.ativo = true;
    }
  }

  // Regras de negócio na entidade
  static create(data: Partial<CanalOrigem>): CanalOrigem {
    const canalOrigem = new CanalOrigem(data);
    canalOrigem.validateBusinessRules();
    return canalOrigem;
  }
  
  validateBusinessRules(): void {
    if (!this.nome || this.nome.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }
    
    if (this.nome.length > 100) {
      throw new Error('Nome não pode ter mais de 100 caracteres');
    }
    
    if (this.descricao && this.descricao.length > 500) {
      throw new Error('Descrição não pode ter mais de 500 caracteres');
    }
  }
  
  activate(): void {
    this.ativo = true;
  }
  
  deactivate(): void {
    this.ativo = false;
  }
  
  canBeDeleted(): boolean {
    // Canal de origem pode ser removido apenas se não tiver clientes associados
    return !this.clientes || this.clientes.length === 0;
  }
}