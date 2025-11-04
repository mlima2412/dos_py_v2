import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Transferência excluída com sucesso',
  })
  message: string;
}

export class PublicIdResponseDto {
  @ApiProperty({
    description: 'Public ID da transferência',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;
}
