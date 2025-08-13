import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsPositive,
  Min,
  Max,
} from 'class-validator';

import { FrequenciaEnum } from '../entities/despesa-recorrente.entity';

export class CreateDespesaRecorrenteDto {

  @ApiProperty({
    description: 'Descrição da despesa recorrente',
    example: 'Aluguel mensal do escritório',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'Valor da despesa recorrente',
    example: 2500.00,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  valor: number;

  @ApiProperty({
    description: 'Frequência da despesa recorrente',
    enum: FrequenciaEnum,
    example: FrequenciaEnum.MENSAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(FrequenciaEnum)
  frequencia?: FrequenciaEnum;

  @ApiProperty({
    description: 'Dia do vencimento da despesa recorrente (1-31)',
    example: 15,
  })
  @IsNumber()
  @Min(1)
  @Max(31)
  diaVencimento: number;

  @ApiProperty({
    description: 'Data de início da despesa recorrente',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiProperty({
    description: 'Data de fim da despesa recorrente',
    example: '2024-12-31T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiProperty({
    description: 'ID da subcategoria da despesa',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  subCategoriaId: number;

  @ApiProperty({
    description: 'ID do parceiro responsável pela despesa',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  parceiroId: number;

  @ApiProperty({
    description: 'ID do fornecedor da despesa',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  fornecedorId?: number;

  @ApiProperty({
    description: 'ID da moeda da despesa',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  currencyId?: number;

  @ApiProperty({
    description: 'Cotação da moeda no momento da despesa',
    example: 5.25,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  cotacao?: number;
}