import { ApiProperty } from '@nestjs/swagger';

export class CreateTransferenciaResponseDto {
  @ApiProperty({
    description: 'ID público da transferência criada',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  publicId: string;
}