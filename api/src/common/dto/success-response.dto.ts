import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para respostas de sucesso genéricas
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Operação realizada com sucesso',
  })
  message: string;
}

/**
 * DTO para respostas de logout
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Mensagem de logout',
    example: 'Logout realizado com sucesso',
  })
  message: string;
}

/**
 * DTO para respostas de ativação/desativação
 */
export class ToggleStatusResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Status alterado com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Novo status',
    example: true,
  })
  ativo: boolean;
}
