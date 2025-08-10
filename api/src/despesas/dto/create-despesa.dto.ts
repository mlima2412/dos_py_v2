import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDespesaDto {
  @ApiProperty({
    description: 'Data da despesa',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataDespesa?: string;

  @ApiProperty({
    description: 'Valor da despesa',
    example: 1500.50,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Type(() => Number)
  valor: number;

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
    description: 'Data de vencimento da despesa',
    example: '2024-01-15T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @ApiProperty({
    description: 'Data de pagamento da despesa',
    example: '2024-01-10T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

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