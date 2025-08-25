import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import * as bcrypt from 'bcrypt';

export class Usuario {
  @ApiProperty({
    description: 'ID interno do usuário',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID público do usuário (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  nome: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@exemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Telefone do usuário para SMS ou WhatsApp',
    example: '+5511999999999',
    required: false,
  })
  telefone: string | null;

  @ApiProperty({
    description: 'Provedor de autenticação',
    example: 'LOCAL',
    default: 'LOCAL',
  })
  provider: string;

  @ApiProperty({
    description: 'ID do Google para autenticação OAuth',
    example: 'google_123456789',
    required: false,
  })
  googleId: string | null;

  @ApiProperty({
    description: 'Senha do usuário (hash)',
    example: '$2b$10$...',
    required: false,
  })
  senha: string | null;

  @ApiProperty({
    description: 'Status ativo do usuário',
    example: true,
    default: true,
  })
  ativo: boolean;

  @ApiProperty({
    description: 'URL do avatar do usuário',
    example: 'https://exemplo.com/avatar.jpg',
    required: false,
  })
  avatar: string | null;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(data?: Partial<Usuario>) {
    if (data) {
      Object.assign(this, data);
    }

    // Gerar valores padrão se não fornecidos
    this.publicId = this.publicId || uuidv7();
    this.provider = this.provider || 'LOCAL';
    this.ativo = this.ativo ?? true;
    this.avatar = this.avatar || '';
    this.createdAt = this.createdAt || new Date();
  }

  static create(data: Partial<Usuario>): Usuario {
    return new Usuario(data);
  }

  /**
   * Define a senha do usuário com hash bcrypt
   * @param password Senha em texto plano
   */
  async setPassword(password: string): Promise<void> {
    const saltRounds = 10;
    this.senha = await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara uma senha em texto plano com o hash armazenado
   * @param password Senha em texto plano para comparar
   * @returns Promise<boolean> true se a senha estiver correta
   */
  async comparePassword(password: string): Promise<boolean> {
    if (!this.senha) {
      return false;
    }
    return bcrypt.compare(password, this.senha);
  }
}
