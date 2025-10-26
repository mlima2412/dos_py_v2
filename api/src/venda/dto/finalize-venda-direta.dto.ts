import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TipoVenda } from '@prisma/client';
import { Type } from 'class-transformer';

export class FinalizeVendaDiretaPagamentoDto {
  @IsInt()
  @IsPositive()
  formaPagamentoId: number;

  @IsEnum(TipoVenda)
  tipo: TipoVenda;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorDelivery?: number | null;

  @IsOptional()
  @IsBoolean()
  entrada?: boolean;

  @ValidateIf(o => o.tipo === TipoVenda.A_PRAZO_SEM_PARCELAS)
  @IsISO8601()
  vencimento?: string;

  @ValidateIf(o => o.tipo === TipoVenda.PARCELADO)
  @IsInt()
  @IsPositive()
  numeroParcelas?: number;

  @ValidateIf(o => o.tipo === TipoVenda.PARCELADO)
  @IsISO8601()
  primeiraParcelaData?: string;
}

export class FinalizeVendaDiretaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FinalizeVendaDiretaPagamentoDto)
  pagamentos: FinalizeVendaDiretaPagamentoDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorFrete?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descontoTotal?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorComissao?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  numeroFatura?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nomeFatura?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ruccnpj?: string | null;
}
