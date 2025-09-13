import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProdutoSkuDto } from './create-produto-sku.dto';

export class UpdateProdutoSkuDto extends PartialType(
  OmitType(CreateProdutoSkuDto, ['produtoId'] as const)
) {}
