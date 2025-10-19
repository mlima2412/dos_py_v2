import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { TipoVenda } from '@prisma/client';

export class CreatePagamentoDto {
  @ApiProperty({ description: 'ID da venda', example: 123 })
  @IsInt()
  vendaId: number;

  @ApiProperty({ description: 'ID da forma de pagamento', example: 1 })
  @IsInt()
  formaPagamentoId: number;

  @ApiProperty({ enum: TipoVenda, description: 'Tipo da venda' })
  @IsEnum(TipoVenda)
  tipo: TipoVenda;

  @ApiProperty({ description: 'Valor pago', example: 100.5 })
  @IsNumber()
  @Min(0)
  valor: number;

  @ApiPropertyOptional({ description: 'Valor do delivery, se houver', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorDelivery?: number | null;

  @ApiProperty({ description: 'É pagamento de entrada?', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  entrada?: boolean = false;
}