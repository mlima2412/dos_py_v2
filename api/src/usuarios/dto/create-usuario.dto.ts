import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@exemplo.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Telefone do usuário para SMS ou WhatsApp',
    example: '+5511999999999',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({
    description: 'Provedor de autenticação',
    example: 'LOCAL',
    default: 'LOCAL',
    required: false,
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({
    description: 'ID do Google para autenticação OAuth',
    example: 'google_123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'minhasenha123',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha?: string;

  @ApiProperty({
    description: 'Status ativo do usuário',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({
    description: 'URL do avatar do usuário',
    example: 'https://exemplo.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
