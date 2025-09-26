import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO base para respostas de erro
 */
export class BaseErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Erro interno do servidor',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'InternalServerError',
  })
  error: string;

  @ApiProperty({
    description: 'Código de status HTTP',
    example: 500,
  })
  statusCode: number;
}

/**
 * DTO para erros de validação (400)
 */
export class ValidationErrorResponseDto extends BaseErrorResponseDto {
  @ApiProperty({
    description: 'Detalhes dos erros de validação',
    example: [
      {
        field: 'email',
        message: 'Email deve ser um endereço válido',
      },
    ],
  })
  errors?: Array<{
    field: string;
    message: string;
  }>;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Dados inválidos',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'BadRequest',
  })
  error: string;

  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;
}

/**
 * DTO para erros de não autorizado (401)
 */
export class UnauthorizedErrorResponseDto extends BaseErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Não autorizado',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Unauthorized',
  })
  error: string;

  @ApiProperty({
    description: 'Código de status HTTP',
    example: 401,
  })
  statusCode: number;
}

/**
 * DTO para erros de não encontrado (404)
 */
export class NotFoundErrorResponseDto extends BaseErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Recurso não encontrado',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Not Found',
  })
  error: string;

  @ApiProperty({
    description: 'Código de status HTTP',
    example: 404,
  })
  statusCode: number;
}

/**
 * DTO para erros de conflito (409)
 */
export class ConflictErrorResponseDto extends BaseErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Recurso está sendo utilizado e não pode ser removido',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Conflict',
  })
  error: string;

  @ApiProperty({
    description: 'Código de status HTTP',
    example: 409,
  })
  statusCode: number;
}

/**
 * DTO para erros internos do servidor (500)
 */
export class InternalServerErrorResponseDto extends BaseErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Erro interno do servidor',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Internal Server Error',
  })
  error: string;

  @ApiProperty({
    description: 'Código de status HTTP',
    example: 500,
  })
  statusCode: number;
}
