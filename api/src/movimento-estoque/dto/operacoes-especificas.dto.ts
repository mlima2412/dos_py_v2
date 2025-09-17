import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class EntradaEstoqueDto {
  @ApiProperty({
    description: 'Public ID do SKU a ser movimentado',
    example: 'sku_123456789',
  })
  @IsString()
  @IsNotEmpty()
  skuPublicId: string;

  @ApiProperty({
    description: 'Quantidade a ser adicionada ao estoque',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  qtd: number;

  @ApiProperty({
    description: 'Public ID do local de destino',
    example: 'local_123456789',
  })
  @IsString()
  @IsNotEmpty()
  localDestinoPublicId: string;

  @ApiPropertyOptional({
    description: 'Observação sobre a entrada',
    example: 'Entrada de mercadoria do fornecedor XYZ',
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class SaidaEstoqueDto {
  @ApiProperty({
    description: 'Public ID do SKU a ser movimentado',
    example: 'sku_123456789',
  })
  @IsString()
  @IsNotEmpty()
  skuPublicId: string;

  @ApiProperty({
    description: 'Quantidade a ser retirada do estoque',
    example: 5,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  qtd: number;

  @ApiProperty({
    description: 'Public ID do local de origem',
    example: 'local_123456789',
  })
  @IsString()
  @IsNotEmpty()
  localOrigemPublicId: string;

  @ApiPropertyOptional({
    description: 'Observação sobre a saída',
    example: 'Saída para venda - Pedido #123',
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class TransferenciaEstoqueDto {
  @ApiProperty({
    description: 'Public ID do SKU a ser movimentado',
    example: 'sku_123456789',
  })
  @IsString()
  @IsNotEmpty()
  skuPublicId: string;

  @ApiProperty({
    description: 'Quantidade a ser transferida',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  qtd: number;

  @ApiProperty({
    description: 'Public ID do local de origem',
    example: 'local_123456789',
  })
  @IsString()
  @IsNotEmpty()
  localOrigemPublicId: string;

  @ApiProperty({
    description: 'Public ID do local de destino',
    example: 'local_987654321',
  })
  @IsString()
  @IsNotEmpty()
  localDestinoPublicId: string;

  @ApiPropertyOptional({
    description: 'Observação sobre a transferência',
    example: 'Transferência entre lojas',
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class AjusteEstoqueDto {
  @ApiProperty({
    description: 'Public ID do SKU a ser ajustado',
    example: 'sku_123456789',
  })
  @IsString()
  @IsNotEmpty()
  skuPublicId: string;

  @ApiProperty({
    description: 'Quantidade do ajuste (pode ser positiva ou negativa)',
    example: -2,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  qtd: number;

  @ApiProperty({
    description: 'Public ID do local onde será feito o ajuste',
    example: 'local_123456789',
  })
  @IsString()
  @IsNotEmpty()
  localPublicId: string;

  @ApiPropertyOptional({
    description: 'Observação sobre o ajuste',
    example: 'Ajuste por inventário - diferença encontrada',
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}
