import { ApiProperty } from '@nestjs/swagger';

class CurrencyDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'pt-BR' })
  locale: string;

  @ApiProperty({ example: 'BRL' })
  isoCode: string;
}

class ParceiroDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  publicId: string;

  @ApiProperty({ example: 'Parceiro Exemplo' })
  nome: string;

  @ApiProperty({ example: 'https://exemplo.com/logo.png', required: false })
  logourl?: string;

  @ApiProperty({ example: 1 })
  currencyId: number;

  @ApiProperty({ type: CurrencyDto })
  currency: CurrencyDto;
}

class PerfilSimpleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Admin' })
  nome: string;
}

export class UserParceiroItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  parceiroId: number;

  @ApiProperty({ type: ParceiroDto })
  Parceiro: ParceiroDto;

  @ApiProperty({ type: PerfilSimpleDto })
  perfil: PerfilSimpleDto;
}
