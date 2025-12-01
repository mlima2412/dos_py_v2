import { PartialType } from '@nestjs/swagger';
import { CreateImpostoDto } from './create-imposto.dto';

export class UpdateImpostoDto extends PartialType(CreateImpostoDto) {}
