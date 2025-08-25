import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Linguagem } from '@prisma/client';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Sobrenome do cliente',
    example: 'Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  sobrenome?: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({
    description: 'RUC/CNPJ do cliente',
    example: '12.345.678/0001-90',
    required: false,
  })
  @IsOptional()
  @IsString()
  ruccnpj?: string;

  @ApiProperty({
    description: 'Endereço do cliente',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiProperty({
    description: 'Cidade do cliente',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiProperty({
    description: 'CEP do cliente',
    example: '01234-567',
    required: false,
  })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiProperty({
    description: 'Observações sobre o cliente',
    example: 'Cliente preferencial',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({
    description: 'Linguagem preferida do cliente',
    example: 'Espanol',
    default: 'Espanol',
    enum: Linguagem,
    required: false,
  })
  @IsOptional()
  @IsEnum(Linguagem)
  linguagem?: Linguagem;

  @ApiProperty({
    description: 'Status ativo do cliente',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({
    description: 'ID do parceiro associado',
    example: 1,
  })
  @IsNumber()
  parceiroId: number;

  @ApiProperty({
    description: 'ID do canal de origem',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  canalOrigemId?: number;
}
