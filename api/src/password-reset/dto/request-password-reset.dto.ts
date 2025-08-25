import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Email do usuário para envio do link de recuperação',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Idioma preferido para o email de recuperação',
    example: 'pt-BR',
    required: false,
    default: 'pt-BR',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
