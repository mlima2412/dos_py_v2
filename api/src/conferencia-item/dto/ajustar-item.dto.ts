import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AjustarItemDto {
  @ApiProperty({
    description: 'Se deve ajustar o estoque com base na conferência',
    example: true,
  })
  @IsBoolean()
  ajustar: boolean;
}