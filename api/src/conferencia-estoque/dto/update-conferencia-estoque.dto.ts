import { PartialType } from '@nestjs/swagger';
import { CreateConferenciaEstoqueDto } from './create-conferencia-estoque.dto';

export class UpdateConferenciaEstoqueDto extends PartialType(CreateConferenciaEstoqueDto) {}
