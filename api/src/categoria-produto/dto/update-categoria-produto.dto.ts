import { PartialType } from '@nestjs/swagger';
import { CreateCategoriaProdutoDto } from './create-categoria-produto.dto';

export class UpdateCategoriaProdutoDto extends PartialType(CreateCategoriaProdutoDto) {}
