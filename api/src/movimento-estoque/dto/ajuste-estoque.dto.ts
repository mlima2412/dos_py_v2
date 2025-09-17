import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AjusteEstoqueDto {
  @ApiProperty({
    description: 'ID do SKU a ser ajustado',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  skuId: number;

  @ApiProperty({
    description: 'ID do local onde será feito o ajuste',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  localId: number;

  @ApiProperty({
    description: 'Quantidade do ajuste. Positivo para aumentar estoque (ex: +5), negativo para diminuir (ex: -3)',
    example: 5,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  qtdAjuste: number;

  @ApiPropertyOptional({
    description: 'Observação sobre o motivo do ajuste',
    example: 'Ajuste após inventário físico - diferença encontrada no estoque',
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}