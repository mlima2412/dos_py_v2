import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateEstoqueSkuDto {
  @ApiProperty({
    description: 'ID do SKU do produto',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  skuId: number;

  @ApiProperty({
    description: 'ID do local de estoque',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  localId: number;

  @ApiProperty({
    description: 'Quantidade em estoque',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  qtd: number;
}