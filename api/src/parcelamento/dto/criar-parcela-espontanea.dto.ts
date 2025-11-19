import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CriarParcelaEspontaneaDto {
  @ApiProperty({
    description: 'Valor da parcela',
    example: 150.5,
  })
  @IsNumber()
  @Min(0.01)
  valor: number;

  @ApiProperty({
    description: 'Data do pagamento',
    required: false,
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  dataPagamento?: string;
}
