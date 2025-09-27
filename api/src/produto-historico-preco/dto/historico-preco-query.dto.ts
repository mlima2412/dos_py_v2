import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoricoPrecoQueryDto {
  @ApiProperty({
    description: 'Data inicial para filtro (formato ISO)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({
    description: 'Data final para filtro (formato ISO)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;

  @ApiProperty({
    description: 'Limite de registros',
    example: 50,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number;
}