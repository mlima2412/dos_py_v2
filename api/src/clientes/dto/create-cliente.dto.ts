import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Linguagem } from '@prisma/client';

export class CreateClienteDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Public ID do cliente',
    example: 1,
  })
  @IsString()
  publicId?: string;

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

  // redesocial
  @ApiProperty({
    description: 'Rede social do cliente',
    example: '@joaosilva',
    required: false,
  })
  @IsOptional()
  @IsString()
  redeSocial?: string;

  @ApiProperty({
    description: 'Celular do cliente',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiProperty({
    description: 'RUC/CNPJ do cliente',
    example: '12.345.678/0001-90',
    required: false,
  })
  @IsOptional()
  @IsString()
  ruccnpj?: string;

  //ruccnpjSecundario
  @ApiProperty({
    description: 'RUC/CNPJ secundario do cliente',
    example: '12.345.678/0001-90',
    required: false,
  })
  @IsOptional()
  @IsString()
  ruccnpjSecundario?: string;

  @ApiProperty({
    description: 'Nome da fatura do cliente',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  nomeFatura?: string;

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

  @ApiProperty({
    description: 'Data de criação do cliente',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdAt?: Date;

  @ApiProperty({
    description: 'Data de atualização do cliente',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: Date;

  @ApiProperty({
    description: 'Data da última compra do cliente',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  ultimaCompra?: Date;
}
