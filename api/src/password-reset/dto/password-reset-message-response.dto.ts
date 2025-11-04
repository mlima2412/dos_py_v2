import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetMessageResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Email de recuperação enviado com sucesso',
  })
  message: string;
}

export class ValidateTokenResponseDto {
  @ApiProperty({
    description: 'Indica se o token é válido',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Mensagem descritiva',
    example: 'Token válido',
  })
  message: string;
}
