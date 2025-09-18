import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmarRecebimentoDto {
  @ApiProperty({
    description: 'Observação sobre o recebimento',
    example: 'Mercadoria recebida em perfeito estado',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}