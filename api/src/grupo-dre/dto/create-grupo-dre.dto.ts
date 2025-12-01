import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoDRE } from '@prisma/client';

export class CreateGrupoDreDto {
  @ApiProperty({
    description: 'Código do grupo DRE (ex: 1000, 2000)',
    example: '1000',
  })
  @IsString()
  codigo: string;

  @ApiProperty({
    description: 'Nome do grupo DRE',
    example: 'Receitas de Vendas',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Tipo do grupo DRE',
    enum: TipoDRE,
    example: 'RECEITA',
  })
  @IsEnum(TipoDRE)
  tipo: TipoDRE;

  @ApiProperty({
    description: 'Ordem de exibição na DRE',
    example: 1,
  })
  @IsInt()
  ordem: number;

  @ApiProperty({
    description: 'Status ativo do grupo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
