import { IsInt, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessDevolucaoItemDto {
  @ApiProperty({
    description: 'ID do SKU a ser devolvido',
    example: 1,
    type: 'integer',
  })
  @IsInt()
  @IsPositive()
  skuId: number;

  @ApiProperty({
    description: 'Quantidade sendo devolvida nesta operação',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  qtdDevolvida: number;
}
