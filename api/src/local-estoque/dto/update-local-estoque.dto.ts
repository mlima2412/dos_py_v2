import { PartialType } from '@nestjs/swagger';
import { CreateLocalEstoqueDto } from './create-local-estoque.dto';

export class UpdateLocalEstoqueDto extends PartialType(CreateLocalEstoqueDto) {}
