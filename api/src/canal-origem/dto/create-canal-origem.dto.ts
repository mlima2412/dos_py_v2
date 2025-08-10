import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCanalOrigemDto {
  @ApiProperty({
    description: 'Nome do canal de origem',
    example: 'Site Institucional',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Descrição do canal de origem',
    example: 'Clientes que chegaram através do site institucional',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Status ativo do canal de origem',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}