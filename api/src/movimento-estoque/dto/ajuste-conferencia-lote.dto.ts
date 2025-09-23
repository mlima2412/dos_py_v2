import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AjusteConferenciaItemDto {
  @ApiProperty({
    description: 'ID do SKU',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  skuId: number;

  @ApiProperty({
    description: 'ID do local de estoque',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  localId: number;

  @ApiProperty({
    description:
      'Diferença entre estoque físico e sistema (positivo = excesso, negativo = falta, zero = sem ajuste)',
    example: -5,
  })
  @IsNumber()
  diferenca: number;
}

export class AjusteConferenciaLoteDto {
  @ApiProperty({
    description: 'Lista de itens para ajuste',
    type: [AjusteConferenciaItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AjusteConferenciaItemDto)
  itens: AjusteConferenciaItemDto[];

  @ApiProperty({
    description: 'Observação para os ajustes',
    example:
      'Ajustes baseados na conferência de estoque realizada em 15/01/2024',
    required: false,
  })
  observacao?: string;
}
