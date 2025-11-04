import { ApiProperty } from '@nestjs/swagger';

export class LocalEmConferenciaResponseDto {
  @ApiProperty({
    description: 'True se existe conferência pendente, false caso contrário',
    example: true,
  })
  emConferencia: boolean;
}
