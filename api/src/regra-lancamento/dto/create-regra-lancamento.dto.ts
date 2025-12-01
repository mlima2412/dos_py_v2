import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegraLancamentoDto {
  @ApiProperty({
    description: 'ID da conta DRE associada',
    example: 1,
  })
  @IsInt()
  contaDreId: number;

  @ApiProperty({
    description: 'ID do imposto (para deduções)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  impostoId?: number;

  @ApiProperty({
    description: 'Nome da regra',
    example: 'Receita de Vendas',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Tipo de gatilho',
    example: 'VENDA_CONFIRMADA',
    enum: ['VENDA_CONFIRMADA', 'VENDA_COM_FATURA'],
  })
  @IsString()
  tipoGatilho: string;

  @ApiProperty({
    description: 'Tipo de venda para filtrar',
    example: 'DIRETA',
    required: false,
    enum: ['DIRETA', 'CONDICIONAL', 'BRINDE', 'PERMUTA'],
  })
  @IsOptional()
  @IsString()
  tipoVenda?: string;

  @ApiProperty({
    description: 'Campo origem para o cálculo',
    example: 'valorTotal',
    required: false,
    enum: ['valorTotal', 'valorFrete', 'valorComissao'],
  })
  @IsOptional()
  @IsString()
  campoOrigem?: string;

  @ApiProperty({
    description: 'Percentual a aplicar (sobrescreve imposto se informado)',
    example: 10.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentual?: number;

  @ApiProperty({
    description: 'Status ativo da regra',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
