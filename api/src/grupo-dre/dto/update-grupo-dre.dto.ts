import { PartialType } from '@nestjs/swagger';
import { CreateGrupoDreDto } from './create-grupo-dre.dto';

export class UpdateGrupoDreDto extends PartialType(CreateGrupoDreDto) {}
