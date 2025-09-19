import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { StatusConferencia } from './create-conferencia-estoque.dto';

export class PaginatedQueryDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Número de itens por página',
    example: 20,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    description: 'Termo de busca',
    example: 'conferência',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filtrar por status',
    enum: StatusConferencia,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusConferencia)
  status?: StatusConferencia;

  @ApiProperty({
    description: 'ID do local de estoque',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  localEstoqueId?: number;
}