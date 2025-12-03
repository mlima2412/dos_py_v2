import { ApiProperty } from '@nestjs/swagger';

export class YearItemDto {
  @ApiProperty({
    description: 'Ano',
    example: '2024',
  })
  ano: string;

  @ApiProperty({
    description: 'Total de despesas no ano',
    example: 150000.50,
  })
  total: number;
}

export class MonthItemDto {
  @ApiProperty({
    description: 'Ano',
    example: '2024',
  })
  ano: string;

  @ApiProperty({
    description: 'Mês (1-12)',
    example: 10,
  })
  mes: number;

  @ApiProperty({
    description: 'Total de despesas no mês',
    example: 15000.50,
  })
  total: number;
}
