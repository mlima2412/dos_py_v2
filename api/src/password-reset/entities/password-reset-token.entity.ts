import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export class PasswordResetToken {
  @ApiProperty({
    description: 'ID único do token de recuperação',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário que solicitou a recuperação',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Token único para recuperação de senha',
    example: 'abc123def456ghi789jkl012mno345pqr678',
  })
  token: string;

  @ApiProperty({
    description: 'Indica se o token já foi utilizado',
    example: false,
    default: false,
  })
  used: boolean;

  @ApiProperty({
    description: 'Data e hora de expiração do token',
    example: '2024-01-01T12:00:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Data e hora em que o token foi utilizado',
    example: '2024-01-01T11:30:00.000Z',
    required: false,
  })
  usedAt?: Date;

  @ApiProperty({
    description: 'Data e hora de criação do token',
    example: '2024-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Usuário associado ao token',
    type: () => Usuario,
  })
  user?: Usuario;

  constructor(data?: Partial<PasswordResetToken>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  /**
   * Verifica se o token ainda é válido (não expirado e não utilizado)
   */
  isValid(): boolean {
    const now = new Date();
    return !this.used && this.expiresAt > now;
  }

  /**
   * Marca o token como utilizado
   */
  markAsUsed(): void {
    this.used = true;
    this.usedAt = new Date();
  }
}