import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContaDreDto {
  @ApiProperty({
    description: 'ID do grupo DRE',
    example: 1,
  })
  @IsInt()
  grupoId: number;

  @ApiProperty({
    description: 'Código contábil opcional',
    example: '1001',
    required: false,
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiProperty({
    description: 'Nome da conta DRE',
    example: 'Venda de Produtos',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Nome original da V1 para mapeamento na migração',
    example: 'Taxa de Transação',
    required: false,
  })
  @IsOptional()
  @IsString()
  nomeV1?: string;

  @ApiProperty({
    description: 'Ordem de exibição dentro do grupo',
    example: 1,
  })
  @IsInt()
  ordem: number;

  @ApiProperty({
    description: 'Status ativo da conta',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
