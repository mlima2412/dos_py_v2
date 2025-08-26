import { PartialType } from '@nestjs/swagger';
import { CreateDespesaClassificacaoCacheDto } from './create-despesa-classificacao-cache.dto';

export class UpdateDespesaClassificacaoCacheDto extends PartialType(
  CreateDespesaClassificacaoCacheDto,
) {}
