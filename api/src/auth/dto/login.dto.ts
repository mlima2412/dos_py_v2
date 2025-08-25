import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
    type: String,
  })
  @IsEmail({}, { message: 'Email deve ser um endereço válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'minhasenha123',
    type: String,
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;
}
