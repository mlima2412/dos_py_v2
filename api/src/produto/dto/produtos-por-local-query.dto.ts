import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
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
}
