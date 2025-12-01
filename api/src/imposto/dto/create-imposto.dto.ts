import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImpostoDto {
  @ApiProperty({
    description: 'Nome do imposto',
    example: 'Impuesto al Valor Agregado',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Sigla do imposto',
    example: 'IVA',
  })
  @IsString()
  sigla: string;

  @ApiProperty({
    description: 'Percentual do imposto (0-100)',
    example: 10.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentual: number;

  @ApiProperty({
    description: 'Status ativo do imposto',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
