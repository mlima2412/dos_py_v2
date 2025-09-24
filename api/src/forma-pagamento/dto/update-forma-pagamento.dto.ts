import { PartialType } from '@nestjs/swagger';
import { CreateFormaPagamentoDto } from './create-forma-pagamento.dto';

export class UpdateFormaPagamentoDto extends PartialType(CreateFormaPagamentoDto) {}
