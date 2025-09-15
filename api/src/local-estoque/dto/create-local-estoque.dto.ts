import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocalEstoqueDto {
  @ApiProperty({
    description: 'ID do parceiro proprietário',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  parceiroId: number;
  @ApiProperty({
    description: 'Nome do local de estoque',
    example: 'Depósito Principal',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Descrição do local de estoque',
    example: 'Depósito principal para produtos acabados',
  })
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({
    description: 'Endereço do local de estoque',
    example: 'Rua das Flores, 123 - Centro',
  })
  @IsString()
  @IsNotEmpty()
  endereco: string;
}