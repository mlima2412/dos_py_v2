import { PartialType } from '@nestjs/swagger';
import { CreateDespesaCacheDto } from './create-despesa-cache.dto';

export class UpdateDespesaCacheDto extends PartialType(CreateDespesaCacheDto) {}
