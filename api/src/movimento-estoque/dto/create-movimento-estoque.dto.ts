import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TipoMovimento {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CONDICIONAL = 'CONDICIONAL',
  DEVOLUCAO = 'DEVOLUCAO',
  AJUSTE = 'AJUSTE',
}

export class CreateMovimentoEstoqueDto {
  @ApiProperty({
    description: 'ID do SKU a ser movimentado',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  skuId: number;

  @ApiProperty({
    description: 'Tipo de movimento do estoque',
    enum: TipoMovimento,
    example: TipoMovimento.ENTRADA,
  })
  @IsEnum(TipoMovimento)
  tipo: TipoMovimento;

  @ApiProperty({
    description: 'Quantidade a ser movimentada. Para AJUSTE, pode ser positiva (aumentar estoque) ou negativa (diminuir estoque)',
    example: 10,
  })
  @IsInt()
  // Para AJUSTE, permite valores negativos. Para outros tipos, mínimo 1
  @ValidateIf((obj) => obj.tipo !== TipoMovimento.AJUSTE)
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  qtd: number;

  @ApiPropertyOptional({
    description:
      'ID do local de origem (obrigatório para SAIDA, TRANSFERENCIA, CONDICIONAL)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  localOrigemId?: number;

  @ApiPropertyOptional({
    description:
      'ID do local de destino (obrigatório para ENTRADA, TRANSFERENCIA, AJUSTE)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  localDestinoId?: number;

  @ApiPropertyOptional({
    description: 'Observação sobre o movimento',
    example: 'Entrada de mercadoria do fornecedor XYZ',
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}
