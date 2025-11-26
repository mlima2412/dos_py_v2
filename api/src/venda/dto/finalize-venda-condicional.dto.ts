import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FinalizeVendaDiretaPagamentoDto } from './finalize-venda-direta.dto';

export class FinalizeVendaCondicionalDto {
  @ApiProperty({
    description: 'Valor do frete',
    example: 10.5,
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorFrete?: number | null;

  @ApiProperty({
    description: 'Desconto total da venda',
    example: 5.0,
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descontoTotal?: number | null;

  @ApiProperty({
    description: 'Valor da comissão',
    example: 15.0,
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorComissao?: number | null;

  @ApiProperty({
    description: 'Número da fatura',
    example: 'FAT-2024-001',
    type: 'string',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  numeroFatura?: string | null;

  @ApiProperty({
    description: 'Nome para emissão da fatura',
    example: 'João Silva',
    type: 'string',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nomeFatura?: string | null;

  @ApiProperty({
    description: 'RUC/CNPJ para emissão da fatura',
    example: '12345678901',
    type: 'string',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ruccnpj?: string | null;

  @ApiProperty({
    description: 'Lista de pagamentos da venda',
    type: [FinalizeVendaDiretaPagamentoDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FinalizeVendaDiretaPagamentoDto)
  pagamentos: FinalizeVendaDiretaPagamentoDto[];
}
