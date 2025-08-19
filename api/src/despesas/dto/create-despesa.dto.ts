import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsInt, IsEnum } from 'class-validator';
import { Type, Exclude } from 'class-transformer';

export enum TipoPagamento {
  A_VISTA_IMEDIATA = 'A_VISTA_IMEDIATA',
  A_PRAZO_SEM_PARCELAS = 'A_PRAZO_SEM_PARCELAS',
  PARCELADO = 'PARCELADO'
}

export class CreateDespesaDto {
  @ApiProperty({
    description: 'Data do registro',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataRegistro?: string;

  @ApiProperty({
    description: 'Valor da despesa',
    example: 1500.50,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Type(() => Number)
  valorTotal: number;

  @ApiProperty({
    description: 'Descrição da despesa',
    example: 'Compra de material de escritório',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'ID da subcategoria da despesa',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  subCategoriaId: number;

  @ApiProperty({
    description: 'ID do parceiro responsável pela despesa',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  parceiroId: number;

  @ApiProperty({
    description: 'ID do fornecedor da despesa',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fornecedorId?: number;

  @ApiProperty({
    description: 'Tipo de pagamento da despesa',
    enum: TipoPagamento,
    example: TipoPagamento.A_VISTA_IMEDIATA,
  })
  @IsEnum(TipoPagamento)
  tipoPagamento: TipoPagamento;

  @ApiProperty({
    description: 'Valor da entrada (apenas para pagamento parcelado)',
    example: 500.00,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Type(() => Number)
  valorEntrada?: number;

  @ApiProperty({
    description: 'Data da primeira parcela (apenas para pagamento parcelado)',
    example: '2024-02-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataPrimeiraParcela?: string;

  @ApiProperty({
    description: 'Número de parcelas (apenas para pagamento parcelado)',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  numeroParcelas?: number;

  @ApiProperty({
    description: 'Data de vencimento (apenas para pagamento à prazo sem parcelas)',
    example: '2024-02-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @ApiProperty({
    description: 'ID da moeda da despesa',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  currencyId?: number;

  @ApiProperty({
    description: 'Cotação da moeda no momento da despesa',
    example: 5.25,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Type(() => Number)
  cotacao?: number;
}