import { PartialType } from '@nestjs/swagger';
import { CreateMovimentoEstoqueDto } from './create-movimento-estoque.dto';

export class UpdateMovimentoEstoqueDto extends PartialType(CreateMovimentoEstoqueDto) {}
