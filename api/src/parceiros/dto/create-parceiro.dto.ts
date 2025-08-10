import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class CreateParceiroDto {
  @ApiProperty({
    description: 'Nome do parceiro',
    example: 'Parceiro ABC Ltda',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'RUC/CNPJ do parceiro',
    example: '12.345.678/0001-90',
    required: false,
  })
  @IsOptional()
  @IsString()
  ruccnpj?: string;

  @ApiProperty({
    description: 'Email do parceiro',
    example: 'contato@parceiroabc.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Rede social do parceiro',
    example: 'https://instagram.com/parceiroabc',
    required: false,
  })
  @IsOptional()
  @IsString()
  redesocial?: string;

  @ApiProperty({
    description: 'Telefone do parceiro',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({
    description: 'Status ativo do parceiro',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({
    description: 'URL do logo do parceiro',
    example: 'https://exemplo.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logourl?: string;

  @ApiProperty({
    description: 'URL da imagem reduzida do parceiro',
    example: 'https://exemplo.com/thumb.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumburl?: string;
}
