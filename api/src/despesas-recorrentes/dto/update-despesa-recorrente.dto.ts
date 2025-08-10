import { PartialType } from '@nestjs/swagger';
import { CreateDespesaRecorrenteDto } from './create-despesa-recorrente.dto';

export class UpdateDespesaRecorrenteDto extends PartialType(CreateDespesaRecorrenteDto) {}