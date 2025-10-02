import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
} from 'class-validator';

export class CreateFornecedorDto {
  @ApiProperty({
    description: 'Código do fornecedor',
    example: 'FORN-001',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'Nome do fornecedor',
    example: 'Fornecedor ABC Ltda',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'ID parceiro do fornecedor',
    example: 1,
  })
  @IsNumber()
  parceiroId: number;

  @ApiProperty({
    description: 'RUC/CNPJ do fornecedor',
    example: '12.345.678/0001-90',
    required: false,
  })
  @IsOptional()
  @IsString()
  ruccnpj?: string;

  @ApiProperty({
    description: 'Email do fornecedor',
    example: 'contato@fornecedorabc.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Telefone do fornecedor',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({
    description: 'Rede social do fornecedor',
    example: '@fornecedorabc',
    required: false,
  })
  @IsOptional()
  @IsString()
  redesocial?: string;

  // ultiaCompra
  @ApiProperty({
    description: 'Data da última compra do fornecedor',
    example: '2023-10-01T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  ultimaCompra?: Date;

  @ApiProperty({
    description: 'Status ativo do fornecedor',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
