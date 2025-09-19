import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ValidateNested, Min, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateMovimentoEstoqueDto } from '../../movimento-estoque/dto/create-movimento-estoque.dto';

export class CreateTransferenciaEstoqueDto {
  @ApiProperty({
    description: 'ID do local de origem da transferência',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  localOrigemId: number;

  @ApiProperty({
    description: 'ID do local de destino da transferência',
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  localDestinoId: number;

  @ApiProperty({
    description: 'Lista de SKUs a serem transferidos',
    type: [CreateMovimentoEstoqueDto],
    example: [
      {
        skuId: 1,
        tipo: 'TRANSFERENCIA',
        qtd: 10,
        observacao: 'Transferência de estoque entre lojas'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMovimentoEstoqueDto)
  skus: CreateMovimentoEstoqueDto[];

  @ApiProperty({
    description: 'Observação geral da transferência',
    example: 'Transferência mensal entre filiais',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  // Nota: parceiroId será obtido automaticamente do header x-parceiro-id
  // Nota: enviadoPorUsuarioId será obtido automaticamente do usuário autenticado
  // dataRecebimento é opcional e só será preenchida na confirmação de recebimento
}