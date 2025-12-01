import { PartialType } from '@nestjs/swagger';
import { CreateRegraLancamentoDto } from './create-regra-lancamento.dto';

export class UpdateRegraLancamentoDto extends PartialType(CreateRegraLancamentoDto) {}
