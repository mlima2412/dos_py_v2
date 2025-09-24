import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProdutosPorLocalQueryDto {
  @ApiPropertyOptional({
    description: 'Se deve incluir apenas produtos com estoque (qtd > 0)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  apenasComEstoque?: boolean = true;

  @ApiPropertyOptional({
    description: 'ID público do fornecedor para filtrar produtos',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsString()
  fornecedorId?: string;
}
