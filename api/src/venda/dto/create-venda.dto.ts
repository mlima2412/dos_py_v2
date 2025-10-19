import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { VendaTipo } from '@prisma/client';

export class CreateVendaDto {
  @ApiProperty({ description: 'ID do cliente', example: 1 })
  @IsInt()
  @IsPositive()
  clienteId: number;

  @ApiProperty({ description: 'ID do local de saída', example: 1 })
  @IsInt()
  @IsPositive()
  localSaidaId: number;

  @ApiProperty({ description: 'Tipo da venda', enum: VendaTipo, required: false, default: VendaTipo.DIRETA })
  @IsOptional()
  @IsEnum(VendaTipo)
  tipo?: VendaTipo;

  @ApiProperty({ description: 'Data de entrega', required: false, example: '2024-01-02T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dataEntrega?: string;

  @ApiProperty({ description: 'Valor do frete', required: false, example: 0, type: 'number' })
  @IsOptional()
  @IsNumber()
  valorFrete?: number;

  @ApiProperty({ description: 'Desconto total da venda', required: false, example: 0, type: 'number' })
  @IsOptional()
  @IsNumber()
  desconto?: number;

  @ApiProperty({ description: 'RUC/CNPJ da fatura da venda', required: false })
  @IsOptional()
  @IsString()
  ruccnpj?: string;

  @ApiProperty({ description: 'Número da fatura', required: false })
  @IsOptional()
  @IsString()
  numeroFatura?: string;

  @ApiProperty({ description: 'Observação da venda', required: false })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty({ description: 'Valor da comissão', required: false, example: 0, type: 'number' })
  @IsOptional()
  @IsNumber()
  valorComissao?: number;
}