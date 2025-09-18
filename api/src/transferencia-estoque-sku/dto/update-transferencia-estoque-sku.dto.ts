import { PartialType } from '@nestjs/swagger';
import { CreateTransferenciaEstoqueSkuDto } from './create-transferencia-estoque-sku.dto';

export class UpdateTransferenciaEstoqueSkuDto extends PartialType(CreateTransferenciaEstoqueSkuDto) {}
