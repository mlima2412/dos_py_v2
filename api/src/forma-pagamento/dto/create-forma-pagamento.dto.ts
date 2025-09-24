import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormaPagamentoDto {
  @ApiProperty({
    description: 'Nome da forma de pagamento',
    example: 'Cartão de Crédito Visa',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiProperty({
    description: 'Taxa da forma de pagamento (em decimal)',
    example: 2.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  taxa?: number;

  @ApiProperty({
    description: 'Tempo de liberação em dias',
    example: 30,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tempoLiberacao?: number = 0;

  @ApiProperty({
    description: 'Se o imposto é calculado após o desconto da taxa',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  impostoPosCalculo?: boolean = false;

  @ApiProperty({
    description: 'Status ativo/inativo da forma de pagamento',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean = true;
}