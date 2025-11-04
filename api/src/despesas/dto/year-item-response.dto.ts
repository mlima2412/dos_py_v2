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
