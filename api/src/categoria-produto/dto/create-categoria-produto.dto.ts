import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCategoriaProdutoDto {
  @ApiProperty({
    description: 'Descrição da categoria do produto',
    example: 'Conjuntos, Camisas, Calças, Acessórios',
    maxLength: 255,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MaxLength(255, { message: 'Descrição deve ter no máximo 255 caracteres' })
  descricao: string;
}
