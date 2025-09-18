import { PartialType } from '@nestjs/swagger';
import { CreateTransferenciaEstoqueDto } from './create-transferencia-estoque.dto';

export class UpdateTransferenciaEstoqueDto extends PartialType(CreateTransferenciaEstoqueDto) {}
