import { ApiProperty } from '@nestjs/swagger';
import { ParcelaStatus } from '@prisma/client';
import { IsInt, IsNumber, IsOptional, Min, IsEnum, IsDateString } from 'class-validator';

export class CreateParcelaDto {
  @ApiProperty({ description: 'ID do parcelamento associado' })
  @IsInt()
  parcelamentoId: number;

  @ApiProperty({ description: 'Número da parcela' })
  @IsInt()
  @Min(1)
  numero: number;

  @ApiProperty({ description: 'Valor da parcela' })
  @IsNumber()
  @Min(0)
  valor: number;

  @ApiProperty({ description: 'Data de vencimento (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  vencimento?: string;

  @ApiProperty({ description: 'Data de recebimento (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  recebidoEm?: string;

  @ApiProperty({ description: 'Status da parcela', enum: ParcelaStatus, required: false })
  @IsOptional()
  @IsEnum(ParcelaStatus)
  status?: ParcelaStatus;
}