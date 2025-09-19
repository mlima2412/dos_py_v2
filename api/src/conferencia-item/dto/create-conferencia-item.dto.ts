import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateConferenciaItemDto {
  @ApiProperty({
    description: 'ID da conferência de estoque',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  conferenciaId: number;

  @ApiProperty({
    description: 'ID do SKU do produto',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  skuId: number;

  @ApiProperty({
    description: 'Quantidade no sistema',
    example: 100,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  qtdSistema?: number;

  @ApiProperty({
    description: 'Quantidade conferida',
    example: 98,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  qtdConferencia?: number;

  @ApiProperty({
    description: 'Se o item foi ajustado',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ajustado?: boolean;
}