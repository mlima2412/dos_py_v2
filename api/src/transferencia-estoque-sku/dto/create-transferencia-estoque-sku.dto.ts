import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTransferenciaEstoqueSkuDto {
  @ApiProperty({
    description: 'ID da transferência de estoque',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  transferenciaId: number;

  @ApiProperty({
    description: 'ID do movimento de estoque',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  movimentoEstoqueId: number;
}