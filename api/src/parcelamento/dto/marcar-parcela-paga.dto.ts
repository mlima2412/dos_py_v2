import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class MarcarParcelaPagaDto {
  @ApiProperty({
    description: 'Data do pagamento',
    required: false,
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  dataPagamento?: string;
}
