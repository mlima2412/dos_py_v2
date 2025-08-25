import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsPositive,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({
    description: 'Nome da moeda',
    example: 'Real Brasileiro',
  })
  @IsString()
  @Length(1, 100)
  nome: string;

  @ApiProperty({
    description: 'Prefixo da moeda',
    example: 'R$',
  })
  @IsString()
  @Length(1, 10)
  prefixo: string;

  @ApiProperty({
    description: 'Código ISO da moeda',
    example: 'BRL',
  })
  @IsString()
  @Length(3, 3)
  isoCode: string;

  @ApiProperty({
    description: 'Precisão decimal da moeda',
    example: 2,
    default: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(8)
  precision?: number;

  @ApiProperty({
    description: 'Locale para formatação',
    example: 'pt-BR',
    default: 'pt-BR',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({
    description: 'Taxa de câmbio padrão',
    example: 1.0,
    default: 0.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  defaultRate?: number;

  @ApiProperty({
    description: 'Status ativo da moeda',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
