import { PartialType } from '@nestjs/swagger';
import { CreateContaDreDto } from './create-conta-dre.dto';

export class UpdateContaDreDto extends PartialType(CreateContaDreDto) {}
