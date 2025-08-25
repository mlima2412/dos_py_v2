import { PartialType } from '@nestjs/swagger';
import { CreateCanalOrigemDto } from './create-canal-origem.dto';

export class UpdateCanalOrigemDto extends PartialType(CreateCanalOrigemDto) {}
