import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class FinalizeVendaSemPagamentoDto {
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
