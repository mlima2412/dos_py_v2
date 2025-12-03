import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, Max, MaxLength } from 'class-validator';
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
    description: 'Taxa da forma de pagamento em formato percentual. Exemplo: 2.5 representa 2.5% (não 0.025). Valor máximo: 100',
    example: 2.5,
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(100)
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
    description: 'Se o imposto (IVA) deve ser adicionado ao valor da taxa ao gerar despesa',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  impostoPosCalculo?: boolean = false;

  @ApiProperty({
    description: 'ID da conta DRE para gerar despesa automática quando há taxa',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  contaDreId?: number;

  @ApiProperty({
    description: 'Status ativo/inativo da forma de pagamento',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean = true;
}