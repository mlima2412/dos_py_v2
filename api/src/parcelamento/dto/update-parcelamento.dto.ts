import { PartialType } from '@nestjs/swagger';
import { CreateParcelamentoDto } from './create-parcelamento.dto';

export class UpdateParcelamentoDto extends PartialType(CreateParcelamentoDto) {}
